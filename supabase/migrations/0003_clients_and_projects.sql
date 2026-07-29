-- clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  type client_type not null default 'company',
  status client_status not null default 'lead',
  display_name text not null check (btrim(display_name) <> ''),
  legal_name text,
  tax_id text,
  email text,
  phone text,
  website text,
  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postal_code text,
  country_code char(2) not null default 'ES',
  preferred_language text not null default 'es',
  source text,
  notes text,
  metadata jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index uq_clients_org_tax_id on public.clients (organization_id, tax_id)
  where tax_id is not null and deleted_at is null;
create index idx_clients_org_status on public.clients (organization_id, status) where deleted_at is null;
create index idx_clients_org_created on public.clients (organization_id, created_at desc);
create index idx_clients_display_name_trgm on public.clients using gin (display_name extensions.gin_trgm_ops);
create index idx_clients_legal_name_trgm on public.clients using gin (legal_name extensions.gin_trgm_ops);
create index idx_clients_tax_id_trgm on public.clients using gin (tax_id extensions.gin_trgm_ops);
create index idx_clients_email_trgm on public.clients using gin (email extensions.gin_trgm_ops);

create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- client_contacts
create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete cascade,
  full_name text not null check (btrim(full_name) <> ''),
  job_title text,
  department text,
  email text,
  phone text,
  mobile text,
  is_primary boolean not null default false,
  receives_billing boolean not null default false,
  receives_support boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index uq_client_contacts_primary on public.client_contacts (client_id)
  where is_primary and deleted_at is null;
create index idx_client_contacts_org on public.client_contacts (organization_id, client_id);

create trigger trg_client_contacts_updated_at
  before update on public.client_contacts
  for each row execute function public.set_updated_at();

-- client_portal_access
create table public.client_portal_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  can_view_projects boolean not null default true,
  can_view_invoices boolean not null default true,
  can_view_documents boolean not null default true,
  can_create_tickets boolean not null default true,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create index idx_client_portal_access_user on public.client_portal_access (user_id);
create index idx_client_portal_access_org on public.client_portal_access (organization_id, client_id);

-- can_access_client: org staff always; portal users only for their linked client
create or replace function public.can_access_client(client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = client_id
      and public.is_organization_member(c.organization_id)
  )
  or exists (
    select 1
    from public.client_portal_access pa
    where pa.client_id = client_id
      and pa.user_id = auth.uid()
  );
$$;

revoke all on function public.can_access_client(uuid) from public;
grant execute on function public.can_access_client(uuid) to authenticated, service_role;

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null,
  slug text not null,
  type project_type not null,
  status project_status not null default 'draft',
  description text,
  production_url text,
  staging_url text,
  repository_url text,
  start_date date,
  target_date date,
  completed_at timestamptz,
  budget numeric(12,2) check (budget >= 0),
  currency_code char(3) not null default 'EUR',
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  assigned_to uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, slug)
);

create index idx_projects_org_status on public.projects (organization_id, status) where deleted_at is null;
create index idx_projects_org_client on public.projects (organization_id, client_id);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- services (catalog)
create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  code text not null,
  category service_category not null,
  billing_type service_billing_type not null,
  default_price numeric(12,2) check (default_price >= 0),
  currency_code char(3) not null default 'EUR',
  default_interval billing_interval,
  tax_rate numeric(5,2) not null default 21.00 check (tax_rate between 0 and 100),
  is_active boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create index idx_services_org_active on public.services (organization_id, is_active);

create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- client_services (subscriptions to a service by a client)
create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  service_id uuid not null references public.services(id) on delete restrict,
  name_override text,
  status subscription_status not null default 'active',
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  currency_code char(3) not null default 'EUR',
  billing_interval billing_interval,
  interval_count integer not null default 1 check (interval_count > 0),
  starts_on date,
  ends_on date,
  next_billing_date date,
  auto_renew boolean not null default true,
  supplier_cost numeric(12,2) check (supplier_cost >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_client_services_org_client on public.client_services (organization_id, client_id);
create index idx_client_services_project on public.client_services (project_id);
create index idx_client_services_next_billing on public.client_services (organization_id, next_billing_date) where deleted_at is null;

create trigger trg_client_services_updated_at
  before update on public.client_services
  for each row execute function public.set_updated_at();
