-- documents: metadata for files stored in Supabase Storage
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  category document_category not null default 'other',
  title text not null,
  description text,
  bucket_id text not null,
  storage_path text not null,
  original_filename text,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  checksum text,
  is_visible_to_client boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket_id, storage_path)
);

create index idx_documents_org_client on public.documents (organization_id, client_id) where deleted_at is null;
create index idx_documents_project on public.documents (project_id);
create index idx_documents_org_category on public.documents (organization_id, category);

create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- backup_configurations
create table public.backup_configurations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  provider_name text not null,
  frequency text not null default 'daily',
  retention_days integer not null default 30 check (retention_days >= 0),
  status backup_status not null default 'pending',
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_backup_config_org on public.backup_configurations (organization_id) where deleted_at is null;
create index idx_backup_config_next_run on public.backup_configurations (organization_id, next_run_at);

create trigger trg_backup_configurations_updated_at
  before update on public.backup_configurations
  for each row execute function public.set_updated_at();

-- backup_records
create table public.backup_records (
  id uuid primary key default gen_random_uuid(),
  backup_configuration_id uuid not null references public.backup_configurations(id) on delete cascade,
  status backup_status not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  storage_path text,
  size_bytes bigint check (size_bytes >= 0),
  checksum text,
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_backup_records_config on public.backup_records (backup_configuration_id, created_at desc);
create index idx_backup_records_status on public.backup_records (status);

create trigger trg_backup_records_updated_at
  before update on public.backup_records
  for each row execute function public.set_updated_at();
