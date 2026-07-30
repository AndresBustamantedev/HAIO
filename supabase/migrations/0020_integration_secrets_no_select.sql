-- ============================================================
-- 0020 — integration_secrets: solo service_role puede leer
--
-- Problema detectado tras aplicar 0017:
--   - anon tenía GRANT SELECT, INSERT, UPDATE, DELETE completos
--   - authenticated tenía GRANT SELECT + política SELECT activa
--   → cualquier owner/admin/manager podía leer secret_ciphertext
--     directamente via /rest/v1/integration_secrets
--
-- Solución:
--   1. Revocar ALL de anon (nunca debe tocar esta tabla)
--   2. Revocar SELECT de authenticated/public
--   3. Eliminar la política integration_secrets_select_privileged
--   4. Crear función SECURITY DEFINER que expone solo secret_type
--   5. Recrear v_integrations_safe usando la función (no la tabla)
--   6. Revocar SELECT de anon sobre v_integrations_safe (hygiene)
-- ============================================================

-- ── 1. Revocar anon ──────────────────────────────────────────
revoke all on public.integration_secrets from anon;

-- ── 2. Revocar SELECT de authenticated y public ───────────────
-- INSERT, UPDATE, DELETE se mantienen con sus políticas RLS
-- (necesarios para Server Actions que crean y rotan secretos).
revoke select on public.integration_secrets from authenticated;
revoke select on public.integration_secrets from public;

-- ── 3. Eliminar política SELECT ───────────────────────────────
drop policy if exists integration_secrets_select_privileged on public.integration_secrets;

-- ── 4. Función SECURITY DEFINER: solo secret_type ────────────
-- Expone: secret_type, configured, created_at, updated_at, last_rotated_at.
-- NUNCA expone: secret_ciphertext, encryption_key_version, id.
-- Verifica has_organization_role antes de devolver datos.
create or replace function public.get_integration_configured_secrets(
  p_integration_id uuid
)
returns table(
  secret_type      text,
  configured       boolean,
  created_at       timestamptz,
  updated_at       timestamptz,
  last_rotated_at  timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.secret_type,
    true                 as configured,
    s.created_at,
    s.updated_at,
    s.last_rotated_at
  from integration_secrets s
  join integrations i on i.id = s.integration_id
  where s.integration_id = p_integration_id
    and i.deleted_at is null
    and has_organization_role(
          i.organization_id,
          '{owner,admin,manager,member,viewer}'::organization_role[]
        )
$$;

-- Solo authenticated puede invocarla.
-- anon no puede: no se le concede EXECUTE.
grant execute on function public.get_integration_configured_secrets(uuid) to authenticated;
revoke execute on function public.get_integration_configured_secrets(uuid) from anon;
revoke execute on function public.get_integration_configured_secrets(uuid) from public;

-- ── 5. Recrear v_integrations_safe ───────────────────────────
-- Subconsulta sobre integration_secrets reemplazada por la función
-- SECURITY DEFINER. La vista mantiene security_invoker = true:
--   · RLS de integrations filtra por organización (filas de la vista)
--   · has_organization_role dentro de la función filtra los secretos
-- Ningún camino expone secret_ciphertext.
drop view if exists public.v_integrations_safe;

create view public.v_integrations_safe
with (security_invoker = true)
as
select
  i.id,
  i.organization_id,
  i.provider_id,
  i.provider_account_id,
  i.connector_type,
  i.environment,
  i.name,
  i.status,
  i.sync_enabled,
  i.sync_frequency,
  i.last_sync_started_at,
  i.last_sync_completed_at,
  i.last_sync_status,
  i.last_sync_error,
  i.last_sync_duration_ms,
  i.last_successful_sync_at,
  i.last_failed_sync_at,
  i.consecutive_failures,
  i.average_sync_duration_ms,
  i.next_sync_at,
  i.resources_count,
  i.unassigned_resources_count,
  i.active_alerts_count,
  i.last_connection_test_at,
  i.last_connection_test_status,
  i.created_by,
  i.created_at,
  i.updated_at,
  i.deleted_at,
  -- Tipos de secretos configurados via función SECURITY DEFINER.
  -- NUNCA expone secret_ciphertext.
  coalesce(
    (select array_agg(gis.secret_type order by gis.secret_type)
     from public.get_integration_configured_secrets(i.id) gis),
    '{}'::text[]
  ) as configured_secret_types,
  p.name         as provider_name,
  p.category     as provider_category,
  p.website      as provider_website
from public.integrations i
join public.providers p on p.id = i.provider_id;

grant select on public.v_integrations_safe to authenticated;

-- ── 6. Revocar SELECT de anon sobre la vista ──────────────────
-- anon heredaba SELECT de un grant previo; revocarlo explícitamente.
-- Los otros grants (INSERT/UPDATE/DELETE sobre una view no-updatable)
-- son inofensivos pero quedan porque vienen de un grant de esquema previo.
revoke select on public.v_integrations_safe from anon;
revoke select on public.v_integrations_safe from public;
