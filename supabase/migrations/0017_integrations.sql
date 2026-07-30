-- ============================================================
-- 0017 — Sistema de integraciones externas
-- Tablas: integrations, integration_secrets, integration_sync_runs,
--         integration_sync_items, external_resources, infrastructure_alerts
-- Funciones: begin_integration_sync (bloqueo atómico)
-- Vista: v_integrations_safe, v_integration_health
-- ============================================================

-- ── 1. Enums ─────────────────────────────────────────────────

create type public.integration_status as enum (
  'disconnected', 'pending', 'connected', 'degraded', 'error', 'disabled'
);

create type public.integration_environment as enum (
  'production', 'sandbox'
);

-- Distingue pruebas de conexión de sincronizaciones de recursos.
create type public.sync_operation_type as enum (
  'test_connection',
  'initial_sync',
  'manual_sync',
  'scheduled_sync',
  'webhook_sync',
  'import',
  'credentials_validation'
);

create type public.sync_run_status as enum (
  'pending', 'running', 'completed', 'partial', 'failed'
);

create type public.sync_item_action as enum (
  'discovered', 'created', 'updated', 'unchanged', 'ignored', 'detached', 'failed'
);

create type public.alert_severity as enum (
  'info', 'low', 'medium', 'high', 'critical'
);

create type public.alert_status as enum (
  'active', 'acknowledged', 'muted', 'resolved', 'ignored'
);

-- ── 2. Tabla integrations ─────────────────────────────────────
-- Una conexión configurada con un proveedor externo.
-- Contiene también métricas de salud para evitar una tabla separada.

create table public.integrations (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations(id) on delete restrict,
  provider_id               uuid not null references public.providers(id) on delete restrict,
  -- provider_account_id es opcional: puede conectarse sin vincular a una cuenta existente
  -- y vincularse después de la primera sync.
  provider_account_id       uuid references public.provider_accounts(id) on delete set null,

  -- Identifica qué lógica de conector usar.
  -- Valores registrados: 'godaddy', 'cloudflare', 'namecheap', 'ovh', 'hostinger'
  connector_type            text not null,

  -- Entorno de la integración. Parte de la restricción única.
  environment               public.integration_environment not null default 'production',

  -- Nombre legible. Ej: "GoDaddy Reseller Principal"
  name                      text not null,

  status                    public.integration_status not null default 'pending',

  -- Configuración de sincronización automática
  sync_enabled              boolean not null default false,
  sync_frequency            text not null default 'daily'
    check (sync_frequency in ('hourly', 'daily', 'weekly')),

  -- Métricas de salud — actualizadas al finalizar cada sync run
  last_sync_started_at      timestamptz,
  last_sync_completed_at    timestamptz,
  last_sync_status          public.sync_run_status,
  last_sync_error           text,     -- Sin secretos
  last_sync_duration_ms     integer,
  last_successful_sync_at   timestamptz,
  last_failed_sync_at       timestamptz,
  consecutive_failures      integer not null default 0 check (consecutive_failures >= 0),
  average_sync_duration_ms  integer,  -- Media móvil actualizada por la aplicación
  next_sync_at              timestamptz,

  -- Métricas de recursos — calculadas o actualizadas por el SyncEngine
  resources_count           integer not null default 0 check (resources_count >= 0),
  unassigned_resources_count integer not null default 0 check (unassigned_resources_count >= 0),
  active_alerts_count       integer not null default 0 check (active_alerts_count >= 0),

  -- Prueba de conexión
  last_connection_test_at   timestamptz,
  last_connection_test_status text
    check (last_connection_test_status in ('success', 'failed')),

  created_by                uuid references auth.users(id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz
);

-- Una organización no puede tener dos integraciones activas con el mismo
-- connector_type + environment + provider_account_id.
-- Permite integraciones duplicadas sólo para cuentas distintas o entornos distintos.
create unique index uq_integrations_active
  on public.integrations (organization_id, connector_type, environment, provider_account_id)
  where deleted_at is null and provider_account_id is not null;

-- Índice sin provider_account_id para integraciones sin cuenta vinculada
create index idx_integrations_org
  on public.integrations (organization_id)
  where deleted_at is null;

create index idx_integrations_provider
  on public.integrations (provider_id);

create index idx_integrations_sync_enabled
  on public.integrations (organization_id, sync_enabled, next_sync_at)
  where deleted_at is null and sync_enabled = true;

create trigger trg_integrations_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

-- ── 3. Tabla integration_secrets ─────────────────────────────
-- Los secretos cifrados de la integración (API key, API secret, tokens).
-- Nunca accesibles desde v_integrations_safe ni desde listados normales.
-- El campo secret_ciphertext solo se lee en Server Actions durante la sync.
--
-- Formato del ciphertext (bytea):
--   byte  0    : versión de formato (0x01)
--   byte  1    : versión de la clave (para rotación)
--   bytes 2-13 : IV (12 bytes, único por cifrado)
--   bytes 14-29: authentication tag GCM (16 bytes)
--   bytes 30+  : ciphertext AES-256-GCM

create table public.integration_secrets (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete restrict,
  integration_id        uuid not null references public.integrations(id) on delete cascade,

  -- Tipo de secreto: 'api_key', 'api_secret', 'oauth_token', 'oauth_refresh',
  -- 'webhook_secret', 'client_id', 'client_secret'
  secret_type           text not null,

  -- Ciphertext AES-256-GCM. NUNCA devolver en listados.
  -- Leer ÚNICAMENTE en Server Actions durante la sync o test de conexión.
  secret_ciphertext     bytea not null,

  -- Versión de la clave de cifrado (para rotación futura).
  encryption_key_version integer not null default 1,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  last_rotated_at       timestamptz,

  -- Una integración solo puede tener un secreto de cada tipo.
  unique (integration_id, secret_type)
);

create index idx_integration_secrets_integration
  on public.integration_secrets (integration_id);

create trigger trg_integration_secrets_updated_at
  before update on public.integration_secrets
  for each row execute function public.set_updated_at();

-- ── 4. Tabla integration_sync_runs ───────────────────────────
-- Registro de cada ejecución (prueba de conexión, sync inicial, manual, cron…).
-- Los campos operation_type y trigger_type diferencian qué se ejecutó.

create table public.integration_sync_runs (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete restrict,
  integration_id      uuid not null references public.integrations(id) on delete cascade,

  -- Qué operación se ejecutó
  operation_type      public.sync_operation_type not null,

  -- Quién lo inició
  trigger_type        text not null
    check (trigger_type in ('user', 'cron', 'webhook', 'system')),

  status              public.sync_run_status not null default 'pending',

  started_at          timestamptz,
  completed_at        timestamptz,
  duration_ms         integer,  -- Calculado al completar

  -- Contadores de recursos procesados (solo relevantes en syncs de recursos)
  resources_found     integer not null default 0,
  resources_created   integer not null default 0,
  resources_updated   integer not null default 0,
  resources_unchanged integer not null default 0,
  resources_failed    integer not null default 0,

  -- Resumen de error sin información sensible
  error_summary       text,

  -- Metadata adicional (paginación, contexto). Sin secretos.
  metadata            jsonb not null default '{}',

  -- Usuario que inició la operación (null para cron y webhook)
  initiated_by        uuid references auth.users(id) on delete set null,

  created_at          timestamptz not null default now()
);

create index idx_sync_runs_integration
  on public.integration_sync_runs (integration_id, created_at desc);

create index idx_sync_runs_org_status
  on public.integration_sync_runs (organization_id, status, created_at desc);

create index idx_sync_runs_running
  on public.integration_sync_runs (integration_id, status)
  where status = 'running';

-- ── 5. Tabla integration_sync_items ──────────────────────────
-- Resultado individual de cada recurso en una sincronización.
-- Append-only: no se permite UPDATE ni DELETE desde la aplicación.

create table public.integration_sync_items (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete restrict,
  sync_run_id           uuid not null references public.integration_sync_runs(id) on delete cascade,
  integration_id        uuid not null references public.integrations(id) on delete cascade,

  -- Tipo de recurso externo (domain, dns_zone, ssl_certificate, hosting, etc.)
  external_resource_type text not null,
  -- ID del recurso en el proveedor externo
  external_resource_id  text not null,

  -- Recurso local al que se vinculó (si aplica)
  local_resource_type   text,
  local_resource_id     uuid,  -- Sin FK formal: puede apuntar a cualquier tabla

  action                public.sync_item_action not null,

  -- Mensaje de error sin información sensible
  error_message         text,

  -- SHA-256 del payload normalizado. Solo para detectar cambios (no es clave de identidad).
  external_payload_hash text,

  created_at            timestamptz not null default now()
);

create index idx_sync_items_run
  on public.integration_sync_items (sync_run_id);

create index idx_sync_items_integration
  on public.integration_sync_items (integration_id, external_resource_type);

create index idx_sync_items_local
  on public.integration_sync_items (local_resource_type, local_resource_id)
  where local_resource_id is not null;

-- Append-only: prohibir UPDATE y DELETE
create trigger trg_sync_items_no_update
  before update on public.integration_sync_items
  for each row execute function public.forbid_modify();

create trigger trg_sync_items_no_delete
  before delete on public.integration_sync_items
  for each row execute function public.forbid_modify();

-- ── 6. Tabla external_resources ──────────────────────────────
-- Capa de enlace genérica entre IDs externos y registros locales.
-- No tiene columnas específicas de ningún proveedor.
-- Soporta: domain, dns_zone, hosting, website, ssl_certificate,
--          email_service, mailbox, database, ftp_account, repository,
--          deployment, backup, project, y cualquier tipo futuro.
--
-- Identidad estable del recurso:
--   (integration_id, environment, external_resource_type, external_resource_id)
-- El external_payload_hash detecta cambios, no identifica recursos.

create table public.external_resources (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations(id) on delete restrict,
  integration_id            uuid not null references public.integrations(id) on delete cascade,
  provider_id               uuid not null references public.providers(id) on delete restrict,

  -- Entorno del que proviene este recurso (debe coincidir con integrations.environment).
  environment               public.integration_environment not null default 'production',

  -- Tipo genérico de recurso (no específico de ningún proveedor).
  external_resource_type    text not null,

  -- ID del recurso según el proveedor externo (nombre de dominio para GoDaddy, etc.)
  external_resource_id      text not null,

  -- Recurso local vinculado manualmente (nunca asignado automáticamente sin revisión).
  -- Nulo hasta que un usuario lo vincule.
  local_resource_type       text,
  local_resource_id         uuid,  -- Sin FK formal para soportar cualquier tabla

  -- Nombre legible del recurso externo (ej: el nombre del dominio).
  external_name             text,

  -- Estado tal como devuelve el proveedor (sin mapear a enums locales).
  external_status           text,

  -- Hash del payload normalizado — SOLO para detectar cambios entre syncs.
  -- No es la clave de identidad del recurso.
  external_payload_hash     text,

  -- Control de presencia: si un recurso no aparece en N syncs exitosas consecutivas,
  -- se genera la alerta external_resource_missing.
  -- Se resetea a 0 cuando el recurso vuelve a aparecer.
  consecutive_missing_syncs integer not null default 0 check (consecutive_missing_syncs >= 0),

  -- Cuándo se vio por última vez en una sync exitosa.
  last_seen_at              timestamptz,
  -- Cuándo se completó la última sync que procesó este recurso.
  last_synced_at            timestamptz,

  -- Payload normalizado del proveedor. Sin secretos.
  raw_metadata              jsonb not null default '{}',

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Identidad estable: un recurso externo es único dentro de una integración + entorno.
create unique index uq_external_resources_identity
  on public.external_resources
  (integration_id, environment, external_resource_type, external_resource_id);

create index idx_external_resources_integration
  on public.external_resources (integration_id);

create index idx_external_resources_local
  on public.external_resources (organization_id, local_resource_type, local_resource_id)
  where local_resource_id is not null;

create index idx_external_resources_unassigned
  on public.external_resources (organization_id, integration_id)
  where local_resource_id is null;

create index idx_external_resources_missing
  on public.external_resources (integration_id, consecutive_missing_syncs)
  where consecutive_missing_syncs > 0;

create trigger trg_external_resources_updated_at
  before update on public.external_resources
  for each row execute function public.set_updated_at();

-- ── 7. Tabla infrastructure_alerts ───────────────────────────
-- Motor de alertas centralizado. Deduplicado por fingerprint.
-- Una alerta se resuelve automáticamente cuando la condición desaparece.

create table public.infrastructure_alerts (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete restrict,
  integration_id      uuid references public.integrations(id) on delete set null,
  client_id           uuid references public.clients(id) on delete set null,

  -- Tipo y localización del recurso afectado
  resource_type       text,
  resource_id         uuid,

  -- Tipo de alerta. Valores definidos en el AlertEngine:
  -- domain_expiring_60_days, domain_expiring_30_days, domain_expiring_15_days,
  -- domain_expiring_7_days, domain_expired, domain_autorenew_disabled,
  -- integration_sync_failed, integration_credentials_invalid,
  -- external_resource_missing, ssl_expiring, hosting_expiring, backup_failed
  alert_type          text not null,

  severity            public.alert_severity not null default 'medium',

  title               text not null,
  description         text,

  -- Fingerprint estable para deduplicación.
  -- Formato: SHA-256(org_id:integration_id:environment:alert_type:resource_type:resource_id)
  -- La restricción única parcial impide duplicados activos.
  fingerprint         text not null,

  status              public.alert_status not null default 'active',

  -- Timestamps de ciclo de vida
  detected_at         timestamptz not null default now(),
  last_detected_at    timestamptz not null default now(),
  resolved_at         timestamptz,
  resolution_reason   text,

  -- Silenciar hasta una fecha (status = 'muted').
  -- Una alerta silenciada actualiza last_detected_at pero no genera notificaciones.
  muted_until         timestamptz,

  -- Quién y cuándo reconoció la alerta
  acknowledged_at     timestamptz,
  acknowledged_by     uuid references auth.users(id) on delete set null,

  -- Metadata adicional (días restantes, contexto del recurso). Sin secretos.
  metadata            jsonb not null default '{}',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Impide duplicados activos/reconocidos/silenciados para el mismo fingerprint.
-- Permite que la misma alerta reaparezca después de resolverse.
create unique index uq_infrastructure_alerts_active_fingerprint
  on public.infrastructure_alerts (organization_id, fingerprint)
  where status not in ('resolved', 'ignored');

create index idx_infrastructure_alerts_org
  on public.infrastructure_alerts (organization_id, status, severity, detected_at desc);

create index idx_infrastructure_alerts_integration
  on public.infrastructure_alerts (integration_id)
  where integration_id is not null;

create index idx_infrastructure_alerts_client
  on public.infrastructure_alerts (client_id)
  where client_id is not null;

create index idx_infrastructure_alerts_resource
  on public.infrastructure_alerts (resource_type, resource_id)
  where resource_id is not null;

create index idx_infrastructure_alerts_muted
  on public.infrastructure_alerts (muted_until)
  where status = 'muted' and muted_until is not null;

create trigger trg_infrastructure_alerts_updated_at
  before update on public.infrastructure_alerts
  for each row execute function public.set_updated_at();

-- ── 8. Función: begin_integration_sync ───────────────────────
-- Bloqueo atómico para prevenir sincronizaciones concurrentes.
-- Usa SELECT FOR UPDATE sobre la fila de integrations como punto de serialización.
-- Compatible con PgBouncer en modo transacción.
--
-- Parámetros:
--   p_integration_id      UUID de la integración
--   p_sync_run_id         UUID del sync_run pre-creado con status='pending'
--   p_stale_timeout_min   Minutos tras los que un run 'running' se considera abandonado
--
-- Retorna:
--   true  → bloqueo adquirido, sync_run actualizado a 'running'
--   false → ya existe un sync activo o la integración no existe

create or replace function public.begin_integration_sync(
  p_integration_id    uuid,
  p_sync_run_id       uuid,
  p_stale_timeout_min integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows_affected integer;
begin
  -- Bloquear la fila de integrations para serializar intentos concurrentes.
  -- Cualquier otra llamada con el mismo integration_id esperará aquí.
  perform id
  from public.integrations
  where id = p_integration_id
    and deleted_at is null
  for update;

  if not found then
    return false;
  end if;

  -- Recuperar runs abandonados (llevan más de p_stale_timeout_min ejecutándose).
  -- Esto garantiza que un crash del servidor no bloquee futuras syncs para siempre.
  update public.integration_sync_runs
  set
    status        = 'failed',
    error_summary = 'Recuperado automáticamente: timeout de ejecución (' || p_stale_timeout_min || ' min) superado.',
    completed_at  = now()
  where integration_id = p_integration_id
    and status        = 'running'
    and started_at    < now() - make_interval(mins => p_stale_timeout_min);

  -- Verificar que no haya ninguna sync activa tras la recuperación.
  if exists (
    select 1
    from public.integration_sync_runs
    where integration_id = p_integration_id
      and status         = 'running'
  ) then
    return false;
  end if;

  -- Activar nuestro sync run de forma atómica (dentro de la misma transacción bloqueada).
  update public.integration_sync_runs
  set
    status     = 'running',
    started_at = now()
  where id             = p_sync_run_id
    and integration_id = p_integration_id
    and status         = 'pending';

  get diagnostics v_rows_affected = row_count;
  return v_rows_affected = 1;
end;
$$;

-- ── 9. Vista v_integrations_safe ─────────────────────────────
-- Excluye integration_secrets.secret_ciphertext.
-- Usar SIEMPRE en listados y componentes de UI.
-- Los secretos solo se leen en Server Actions durante sync/test.

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
  -- Tipos de secretos configurados (sin sus valores)
  coalesce(
    (select array_agg(s.secret_type order by s.secret_type)
     from public.integration_secrets s
     where s.integration_id = i.id),
    '{}'::text[]
  ) as configured_secret_types,
  -- Proveedor (join para evitar queries adicionales en la UI)
  p.name         as provider_name,
  p.category     as provider_category,
  p.website      as provider_website
from public.integrations i
join public.providers p on p.id = i.provider_id;

-- ── 10. Vista v_integration_health ───────────────────────────
-- Panel de salud de integraciones. Calcula métricas en tiempo real
-- que no se almacenan en la tabla (evita duplicar datos).

create view public.v_integration_health
with (security_invoker = true)
as
select
  i.id                        as integration_id,
  i.organization_id,
  i.name,
  i.connector_type,
  i.environment,
  i.status,
  i.consecutive_failures,
  i.last_successful_sync_at,
  i.last_failed_sync_at,
  i.last_sync_duration_ms,
  i.average_sync_duration_ms,
  i.resources_count,
  i.unassigned_resources_count,
  i.active_alerts_count,
  -- Runs de las últimas 24 horas
  (select count(*)
   from public.integration_sync_runs r
   where r.integration_id = i.id
     and r.created_at > now() - interval '24 hours'
     and r.operation_type in ('manual_sync', 'scheduled_sync', 'initial_sync')
  ) as syncs_last_24h,
  -- Fallos en las últimas 24 horas
  (select count(*)
   from public.integration_sync_runs r
   where r.integration_id = i.id
     and r.created_at > now() - interval '24 hours'
     and r.status = 'failed'
  ) as failures_last_24h,
  -- Recursos sin asignar
  (select count(*)
   from public.external_resources er
   where er.integration_id = i.id
     and er.local_resource_id is null
  ) as current_unassigned_count,
  -- Alertas activas de esta integración
  (select count(*)
   from public.infrastructure_alerts a
   where a.integration_id = i.id
     and a.status in ('active', 'acknowledged')
  ) as current_active_alerts
from public.integrations i
where i.deleted_at is null;

-- ── 11. Habilitar RLS en las 6 tablas nuevas ─────────────────

alter table public.integrations              enable row level security;
alter table public.integration_secrets       enable row level security;
alter table public.integration_sync_runs     enable row level security;
alter table public.integration_sync_items    enable row level security;
alter table public.external_resources        enable row level security;
alter table public.infrastructure_alerts     enable row level security;

-- ── 12. Políticas RLS ────────────────────────────────────────

-- integrations: lectura para todo el staff; escritura para admin/manager;
-- borrado lógico para admin.
create policy integrations_select_staff
  on public.integrations for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy integrations_insert_staff
  on public.integrations for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy integrations_update_staff
  on public.integrations for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy integrations_delete_staff
  on public.integrations for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- integration_secrets: solo owner/admin/manager. Los secretos son extremadamente sensibles.
-- El campo secret_ciphertext nunca debe salir de una Server Action.
create policy integration_secrets_select_privileged
  on public.integration_secrets for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy integration_secrets_insert_privileged
  on public.integration_secrets for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy integration_secrets_update_privileged
  on public.integration_secrets for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy integration_secrets_delete_privileged
  on public.integration_secrets for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- integration_sync_runs: lectura amplia (útil para dashboards); escritura para staff activo.
create policy sync_runs_select_staff
  on public.integration_sync_runs for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy sync_runs_insert_staff
  on public.integration_sync_runs for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy sync_runs_update_staff
  on public.integration_sync_runs for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- integration_sync_items: solo lectura desde la app (append-only mediante trigger).
create policy sync_items_select_staff
  on public.integration_sync_items for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy sync_items_insert_staff
  on public.integration_sync_items for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- external_resources: lectura para staff; asignación (update) para manager+.
create policy external_resources_select_staff
  on public.external_resources for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy external_resources_insert_staff
  on public.external_resources for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy external_resources_update_staff
  on public.external_resources for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy external_resources_delete_staff
  on public.external_resources for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- infrastructure_alerts: lectura para staff; gestión para manager+.
create policy alerts_select_staff
  on public.infrastructure_alerts for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy alerts_insert_staff
  on public.infrastructure_alerts for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy alerts_update_staff
  on public.infrastructure_alerts for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- ── 13. GRANTs ───────────────────────────────────────────────

grant select, insert, update, delete
  on public.integrations            to authenticated;

grant select, insert, update, delete
  on public.integration_secrets     to authenticated;

grant select, insert, update, delete
  on public.integration_sync_runs   to authenticated;

grant select, insert
  on public.integration_sync_items  to authenticated;

grant select, insert, update, delete
  on public.external_resources      to authenticated;

grant select, insert, update, delete
  on public.infrastructure_alerts   to authenticated;

grant select on public.v_integrations_safe   to authenticated;
grant select on public.v_integration_health  to authenticated;

-- La función begin_integration_sync necesita ser invocable por usuarios autenticados.
grant execute on function public.begin_integration_sync(uuid, uuid, integer) to authenticated;

-- ── 14. Nota de retención de integration_sync_items ──────────
-- Política propuesta (pendiente de aprobación antes de implementar borrados):
--   - Conservar sync_items de runs de las últimas 90 días.
--   - Conservar indefinidamente las filas de integration_sync_runs (solo resúmenes).
--   - Eliminar sync_items de runs antiguos mediante tarea programada futura.
--   - NUNCA borrar automáticamente sin documentar y aprobar la estrategia.
-- No se implementan borrados automáticos en esta migración.
