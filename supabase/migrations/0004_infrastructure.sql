-- domains
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  domain_name extensions.citext not null,
  status domain_status not null default 'unknown',
  registrar_name text,
  registrar_account_reference text,
  registered_on date,
  expires_on date,
  renewal_price numeric(12,2) check (renewal_price >= 0),
  currency_code char(3) not null default 'EUR',
  auto_renew boolean not null default false,
  managed_by_us boolean not null default true,
  nameservers text[] not null default '{}',
  privacy_enabled boolean not null default false,
  transfer_lock_enabled boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index uq_domains_org_domain_active on public.domains (organization_id, domain_name)
  where deleted_at is null;
create index idx_domains_org_expires on public.domains (organization_id, expires_on);
create index idx_domains_org_status on public.domains (organization_id, status);
create index idx_domains_client on public.domains (client_id);

create trigger trg_domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

-- hosting_accounts
create table public.hosting_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  provider_name text not null,
  plan_name text,
  status hosting_status not null default 'pending',
  panel_url text,
  server_hostname text,
  server_ip inet,
  starts_on date,
  expires_on date,
  renewal_price numeric(12,2) check (renewal_price >= 0),
  currency_code char(3) not null default 'EUR',
  billing_interval billing_interval,
  auto_renew boolean not null default false,
  storage_limit_mb bigint check (storage_limit_mb >= 0),
  bandwidth_limit_mb bigint check (bandwidth_limit_mb >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_hosting_org_expires on public.hosting_accounts (organization_id, expires_on);
create index idx_hosting_org_status on public.hosting_accounts (organization_id, status);
create index idx_hosting_client on public.hosting_accounts (client_id);

create trigger trg_hosting_accounts_updated_at
  before update on public.hosting_accounts
  for each row execute function public.set_updated_at();

-- email_services (mailbox plan contracted for a domain/client)
create table public.email_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  domain_id uuid references public.domains(id) on delete set null,
  provider_name text not null,
  plan_name text,
  status hosting_status not null default 'pending',
  starts_on date,
  expires_on date,
  renewal_price numeric(12,2) check (renewal_price >= 0),
  currency_code char(3) not null default 'EUR',
  billing_interval billing_interval,
  auto_renew boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_email_services_org_expires on public.email_services (organization_id, expires_on);
create index idx_email_services_client on public.email_services (client_id);
create index idx_email_services_domain on public.email_services (domain_id);

create trigger trg_email_services_updated_at
  before update on public.email_services
  for each row execute function public.set_updated_at();

-- email_accounts (individual mailboxes; no password stored)
create table public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  email_service_id uuid not null references public.email_services(id) on delete cascade,
  address extensions.citext not null,
  display_name text,
  quota_mb integer check (quota_mb >= 0),
  status text not null default 'active',
  forwards_to text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (email_service_id, address)
);

create index idx_email_accounts_org on public.email_accounts (organization_id, email_service_id);

create trigger trg_email_accounts_updated_at
  before update on public.email_accounts
  for each row execute function public.set_updated_at();
