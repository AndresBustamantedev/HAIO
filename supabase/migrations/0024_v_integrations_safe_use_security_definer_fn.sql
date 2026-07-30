-- La vista usaba un subquery directo sobre integration_secrets, cuyo GRANT a authenticated
-- fue revocado en 0018-0021. Como security_invoker=true, el subquery falla con permission denied.
-- Solución: usar la función SECURITY DEFINER get_integration_configured_secrets que ya existe.
create or replace view public.v_integrations_safe
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
  coalesce(
    (select array_agg(secret_type order by secret_type)
     from public.get_integration_configured_secrets(i.id)),
    '{}'::text[]
  ) as configured_secret_types,
  p.name         as provider_name,
  p.category     as provider_category,
  p.website      as provider_website
from public.integrations i
left join public.providers p on p.id = i.provider_id;
