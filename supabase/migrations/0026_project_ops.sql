-- ─────────────────────────────────────────────────────────────────────────────
-- 0026 · Project Operations Center
-- Extiende las fichas de proyecto con: notas/wiki/diario + miembros + vault mejorado
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nuevos valores en credential_type para Vault
alter type credential_type add value if not exists 'license';
alter type credential_type add value if not exists 'saas';

-- 2. project_notes — wiki técnica, diario de cambios, snippets, notas internas
create table public.project_notes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete restrict,
  project_id       uuid not null references public.projects(id) on delete cascade,
  type             text not null default 'note'
                   check (type in ('note', 'wiki', 'changelog', 'snippet')),
  title            text,
  body             text not null,
  metadata         jsonb not null default '{}',  -- snippet: {language}, tags, etc.
  pinned           boolean not null default false,
  created_by       uuid references auth.users(id) on delete set null,
  updated_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index idx_project_notes_project on public.project_notes (project_id, type)
  where deleted_at is null;
create index idx_project_notes_pinned  on public.project_notes (project_id, pinned)
  where deleted_at is null;

create trigger trg_project_notes_updated_at
  before update on public.project_notes
  for each row execute function public.set_updated_at();

-- 3. project_members — personas con acceso al proyecto
create table public.project_members (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete restrict,
  project_id       uuid not null references public.projects(id) on delete cascade,
  name             text not null,
  email            text,
  role             text not null default 'other'
                   check (role in ('owner','developer','designer','marketing','client','seo','other')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_project_members_project on public.project_members (project_id);

create trigger trg_project_members_updated_at
  before update on public.project_members
  for each row execute function public.set_updated_at();

-- 4. RLS — project_notes
alter table public.project_notes enable row level security;

create policy project_notes_select
  on public.project_notes for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy project_notes_insert
  on public.project_notes for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy project_notes_update
  on public.project_notes for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy project_notes_delete
  on public.project_notes for delete
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- 5. RLS — project_members
alter table public.project_members enable row level security;

create policy project_members_select
  on public.project_members for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy project_members_insert
  on public.project_members for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy project_members_update
  on public.project_members for update
  using  (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy project_members_delete
  on public.project_members for delete
  using  (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- 6. credentials — exponer project_id en la vista segura (ya existe la columna)
-- La vista v_credentials_safe ya existe; basta con añadir project_id a su SELECT.
-- Recreamos la vista añadiendo project_id:
create or replace view public.v_credentials_safe as
select
  id, organization_id, client_id, project_id,
  domain_id, hosting_account_id, email_account_id,
  provider_account_id, website_installation_id,
  type, label, username, login_url,
  secret_reference, credential_mode,
  notes, is_shared_with_client,
  last_verified_at, expires_at,
  secret_version, encryption_key_version,
  created_by, updated_by, created_at, updated_at, deleted_at
from public.credentials;

grant select on public.v_credentials_safe to authenticated, service_role;
