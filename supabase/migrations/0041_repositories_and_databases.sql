-- Repositories
create table repositories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  name            text not null,
  provider        text not null default '',
  url             text,
  visibility      text not null default 'private',
  status          text not null default 'active',
  notes           text,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table repositories enable row level security;

create policy repositories_select on repositories for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy repositories_insert on repositories for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy repositories_update on repositories for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy repositories_delete on repositories for delete
  using (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- Databases
create table databases (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  name            text not null,
  engine          text not null default 'postgresql',
  engine_version  text,
  provider        text,
  host            text,
  status          text not null default 'active',
  notes           text,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table databases enable row level security;

create policy databases_select on databases for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy databases_insert on databases for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy databases_update on databases for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy databases_delete on databases for delete
  using (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

-- GRANTs
grant select, insert, update, delete on public.repositories to authenticated;
grant select, insert, update, delete on public.databases     to authenticated;
