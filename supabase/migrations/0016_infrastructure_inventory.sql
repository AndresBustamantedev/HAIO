-- ============================================================
-- 0012 — Inventario de infraestructura y accesos
-- Incrementa el esquema existente (sin tocar las 11 migraciones previas).
-- ============================================================

-- ── 1. Enum nuevos ──────────────────────────────────────────

create type public.provider_category as enum (
  'registrar', 'hosting', 'email', 'dns', 'cms', 'cloud', 'other'
);

-- ── 2. Tabla providers ──────────────────────────────────────
-- Catálogo normalizado de empresas/plataformas proveedoras.

create table public.providers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name            text not null,
  category        public.provider_category not null default 'other',
  website         text,
  support_url     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create unique index uq_providers_org_name_active
  on public.providers (organization_id, lower(name))
  where deleted_at is null;

create index idx_providers_org_category
  on public.providers (organization_id, category);

create trigger trg_providers_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();

-- ── 3. Tabla provider_accounts ─────────────────────────────
-- Cuenta concreta que HAIO utiliza en un proveedor.
-- Puede administrar recursos de varios clientes.

create table public.provider_accounts (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete restrict,
  provider_id        uuid not null references public.providers(id) on delete restrict,
  label              text not null,
  account_reference  text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create index idx_provider_accounts_provider
  on public.provider_accounts (provider_id);

create index idx_provider_accounts_org
  on public.provider_accounts (organization_id);

create trigger trg_provider_accounts_updated_at
  before update on public.provider_accounts
  for each row execute function public.set_updated_at();

-- ── 4. Tabla hosting_sites ─────────────────────────────────
-- Cada sitio alojado dentro de una cuenta de hosting.
-- Permite representar hosting compartido entre clientes.

create table public.hosting_sites (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete restrict,
  hosting_account_id uuid not null references public.hosting_accounts(id) on delete restrict,
  client_id         uuid not null references public.clients(id) on delete restrict,
  project_id        uuid references public.projects(id) on delete set null,
  domain_id         uuid references public.domains(id) on delete set null,
  site_label        text not null,
  document_root     text,
  is_primary        boolean not null default false,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index idx_hosting_sites_hosting_account
  on public.hosting_sites (hosting_account_id);

create index idx_hosting_sites_client
  on public.hosting_sites (client_id);

create index idx_hosting_sites_org
  on public.hosting_sites (organization_id);

create trigger trg_hosting_sites_updated_at
  before update on public.hosting_sites
  for each row execute function public.set_updated_at();

-- ── 5. Tabla website_installations ─────────────────────────
-- Instalación CMS / web dentro de un hosting_site.

create table public.website_installations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete restrict,
  client_id        uuid not null references public.clients(id) on delete restrict,
  project_id       uuid references public.projects(id) on delete set null,
  domain_id        uuid references public.domains(id) on delete set null,
  hosting_site_id  uuid references public.hosting_sites(id) on delete set null,
  name             text not null,
  public_url       text,
  admin_url        text,
  cms_type         text not null default 'other'
    check (cms_type in ('wordpress','shopify','prestashop','joomla','drupal','magento','woocommerce','custom','other')),
  cms_version      text,
  environment      text not null default 'production'
    check (environment in ('production','staging','development','testing')),
  status           text not null default 'active'
    check (status in ('active','maintenance','inactive','archived')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index idx_website_installations_client
  on public.website_installations (client_id);

create index idx_website_installations_org
  on public.website_installations (organization_id);

create index idx_website_installations_domain
  on public.website_installations (domain_id);

create index idx_website_installations_hosting_site
  on public.website_installations (hosting_site_id);

create trigger trg_website_installations_updated_at
  before update on public.website_installations
  for each row execute function public.set_updated_at();

-- ── 6. ALTER TABLE domains ──────────────────────────────────

alter table public.domains
  add column provider_account_id uuid
    references public.provider_accounts(id) on delete set null,
  add column internal_cost numeric(12,2)
    check (internal_cost >= 0);

create index idx_domains_provider_account
  on public.domains (provider_account_id);

-- ── 7. ALTER TABLE hosting_accounts ─────────────────────────

alter table public.hosting_accounts
  add column provider_account_id uuid
    references public.provider_accounts(id) on delete set null,
  add column internal_cost numeric(12,2)
    check (internal_cost >= 0),
  add column is_shared boolean not null default false;

create index idx_hosting_accounts_provider_account
  on public.hosting_accounts (provider_account_id);

-- ── 8. ALTER TABLE email_services ──────────────────────────

alter table public.email_services
  add column provider_account_id uuid
    references public.provider_accounts(id) on delete set null,
  add column internal_cost numeric(12,2)
    check (internal_cost >= 0);

create index idx_email_services_provider_account
  on public.email_services (provider_account_id);

-- ── 9. ALTER TABLE credentials ──────────────────────────────
-- Añadir columnas de cifrado y vínculos sin eliminar secret_reference.

alter table public.credentials
  add column provider_account_id      uuid
    references public.provider_accounts(id) on delete set null,
  add column website_installation_id  uuid
    references public.website_installations(id) on delete set null,
  add column secret_ciphertext        bytea,
  add column secret_version           integer not null default 1,
  add column encryption_key_version   integer not null default 1,
  add column credential_mode          text not null default 'none'
    check (credential_mode in ('encrypted', 'external_reference', 'none'));

-- Migrar filas existentes que ya tienen secret_reference.
update public.credentials
set credential_mode = 'external_reference'
where secret_reference is not null and secret_reference <> '';

-- Restricción de coherencia: evita estados imposibles.
-- - encrypted     → ciphertext obligatorio, reference prohibido
-- - external_ref  → reference obligatorio, ciphertext prohibido
-- - none          → ambos nulos
alter table public.credentials
  add constraint credentials_mode_coherence check (
    (credential_mode = 'encrypted'
      and secret_ciphertext is not null
      and (secret_reference is null or secret_reference = ''))
    or
    (credential_mode = 'external_reference'
      and secret_reference is not null and secret_reference <> ''
      and secret_ciphertext is null)
    or
    (credential_mode = 'none'
      and secret_ciphertext is null
      and (secret_reference is null or secret_reference = ''))
  );

create index idx_credentials_provider_account
  on public.credentials (provider_account_id);

create index idx_credentials_website_installation
  on public.credentials (website_installation_id);

-- ── 10. Vista v_credentials_safe ────────────────────────────
-- Excluye secret_ciphertext. Úsala en listados; nunca en el flujo de revelado.

create view public.v_credentials_safe
with (security_invoker = true)
as
select
  id,
  organization_id,
  client_id,
  project_id,
  domain_id,
  hosting_account_id,
  email_account_id,
  provider_account_id,
  website_installation_id,
  type,
  label,
  username,
  login_url,
  secret_reference,
  credential_mode,
  secret_version,
  encryption_key_version,
  notes,
  is_shared_with_client,
  last_verified_at,
  expires_at,
  created_by,
  updated_by,
  created_at,
  updated_at,
  deleted_at
from public.credentials;

-- ── 11. Vista v_client_infrastructure ───────────────────────

create view public.v_client_infrastructure
with (security_invoker = true)
as
select
  c.id                         as client_id,
  c.organization_id,
  (select count(*)
   from public.domains d
   where d.client_id = c.id and d.deleted_at is null)                     as domain_count,
  (select coalesce(sum(d2.internal_cost), 0)
   from public.domains d2
   where d2.client_id = c.id and d2.deleted_at is null)                   as domains_internal_cost,
  (select count(*)
   from public.hosting_accounts ha
   where ha.client_id = c.id and ha.deleted_at is null)                   as hosting_count,
  (select coalesce(sum(ha2.internal_cost), 0)
   from public.hosting_accounts ha2
   where ha2.client_id = c.id and ha2.deleted_at is null)                 as hosting_internal_cost,
  (select count(*)
   from public.email_services es
   where es.client_id = c.id and es.deleted_at is null)                   as email_service_count,
  (select count(*)
   from public.email_accounts ea
   join public.email_services es2 on ea.email_service_id = es2.id
   where es2.client_id = c.id and ea.deleted_at is null)                  as mailbox_count,
  (select count(*)
   from public.website_installations wi
   where wi.client_id = c.id and wi.deleted_at is null)                   as website_installation_count,
  (select count(*)
   from public.credentials cr
   where cr.client_id = c.id and cr.deleted_at is null)                   as credential_count
from public.clients c
where c.deleted_at is null;

-- ── 12. RLS — habilitar en tablas nuevas ────────────────────

alter table public.providers              enable row level security;
alter table public.provider_accounts      enable row level security;
alter table public.hosting_sites          enable row level security;
alter table public.website_installations  enable row level security;

-- providers: lectura para todo el staff; escritura para admin/manager; borrado para admin.
create policy providers_select_staff
  on public.providers for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy providers_insert_staff
  on public.providers for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy providers_update_staff
  on public.providers for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy providers_delete_staff
  on public.providers for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- provider_accounts: solo owner/admin/manager (sensible — contiene referencias de cuenta).
create policy provider_accounts_select_staff
  on public.provider_accounts for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy provider_accounts_insert_staff
  on public.provider_accounts for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy provider_accounts_update_staff
  on public.provider_accounts for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy provider_accounts_delete_staff
  on public.provider_accounts for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- hosting_sites: mismo acceso que hosting_accounts.
create policy hosting_sites_select_staff
  on public.hosting_sites for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy hosting_sites_insert_staff
  on public.hosting_sites for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy hosting_sites_update_staff
  on public.hosting_sites for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy hosting_sites_delete_staff
  on public.hosting_sites for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- website_installations: mismos permisos que proyectos.
create policy website_installations_select_staff
  on public.website_installations for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy website_installations_insert_staff
  on public.website_installations for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy website_installations_update_staff
  on public.website_installations for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy website_installations_delete_staff
  on public.website_installations for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- ── 13. Grants de acceso a las nuevas tablas ─────────────────
-- Las tablas en el esquema public expuesto mediante Data API necesitan GRANT
-- explícito para anon/authenticated cuando RLS ya está habilitado.

grant select, insert, update, delete
  on public.providers             to authenticated;
grant select, insert, update, delete
  on public.provider_accounts     to authenticated;
grant select, insert, update, delete
  on public.hosting_sites         to authenticated;
grant select, insert, update, delete
  on public.website_installations to authenticated;

-- Las vistas heredan los grants de las tablas subyacentes a través de
-- security_invoker, pero necesitan un GRANT propio sobre la vista.
grant select on public.v_credentials_safe       to authenticated;
grant select on public.v_client_infrastructure  to authenticated;
