-- ============================================================
-- 0025 — Funciones RPC para consecutive_missing_syncs
--
-- Estas funciones son llamadas por el ResourceMatcher para
-- incrementar el contador cuando un recurso externo no aparece
-- en una sincronización.
--
-- SECURITY DEFINER: el caller solo necesita permisos de lectura
-- en external_resources; la función escala a los del owner.
-- ============================================================

-- ── Batch: incrementa para un array de external_resource_ids ─

create or replace function public.increment_missing_syncs(
  p_integration_id uuid,
  p_environment    text,
  p_external_ids   text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.external_resources
  set
    consecutive_missing_syncs = consecutive_missing_syncs + 1,
    updated_at = now()
  where
    integration_id = p_integration_id
    and environment::text = p_environment
    and external_resource_id = any(p_external_ids);
end;
$$;

-- ── Single: fallback para un solo external_resource_id ───────

create or replace function public.increment_missing_syncs_single(
  p_integration_id uuid,
  p_environment    text,
  p_external_id    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.external_resources
  set
    consecutive_missing_syncs = consecutive_missing_syncs + 1,
    updated_at = now()
  where
    integration_id = p_integration_id
    and environment::text = p_environment
    and external_resource_id = p_external_id;
end;
$$;

-- Solo service_role puede ejecutar estas funciones.
revoke execute on function public.increment_missing_syncs(uuid, text, text[])
  from public, anon, authenticated;
grant  execute on function public.increment_missing_syncs(uuid, text, text[])
  to service_role;

revoke execute on function public.increment_missing_syncs_single(uuid, text, text)
  from public, anon, authenticated;
grant  execute on function public.increment_missing_syncs_single(uuid, text, text)
  to service_role;
