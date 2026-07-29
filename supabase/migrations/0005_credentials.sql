-- credentials: metadata only, secrets live in Vault/external manager, referenced by secret_reference
create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  domain_id uuid references public.domains(id) on delete set null,
  hosting_account_id uuid references public.hosting_accounts(id) on delete set null,
  email_account_id uuid references public.email_accounts(id) on delete set null,
  type credential_type not null,
  label text not null,
  username text,
  login_url text,
  secret_reference text,
  notes text,
  is_shared_with_client boolean not null default false,
  last_verified_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_credentials_org on public.credentials (organization_id) where deleted_at is null;
create index idx_credentials_client on public.credentials (client_id);
create index idx_credentials_project on public.credentials (project_id);
create index idx_credentials_expires on public.credentials (organization_id, expires_at);

create trigger trg_credentials_updated_at
  before update on public.credentials
  for each row execute function public.set_updated_at();

-- credential_access_logs: append-only audit trail
create table public.credential_access_logs (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.credentials(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action credential_access_action not null,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_credential_access_logs_credential on public.credential_access_logs (credential_id, created_at desc);
create index idx_credential_access_logs_user on public.credential_access_logs (user_id);

-- Append-only guard, reused by every append-only table (credential_access_logs, audit_logs).
create or replace function public.forbid_modify()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'This table is append-only: % is not allowed on %', tg_op, tg_table_name;
end;
$$;

create trigger trg_credential_access_logs_no_update
  before update on public.credential_access_logs
  for each row execute function public.forbid_modify();

create trigger trg_credential_access_logs_no_delete
  before delete on public.credential_access_logs
  for each row execute function public.forbid_modify();
