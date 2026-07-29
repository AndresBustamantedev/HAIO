-- activity_logs: human-readable feed for the UI
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_activity_logs_org_created on public.activity_logs (organization_id, created_at desc);
create index idx_activity_logs_entity on public.activity_logs (entity_type, entity_id);

-- audit_logs: append-only technical trail.
-- organization_id is an addition on top of the base spec (section 17) so that
-- RLS can scope "only owner/admin may read audit logs" per organization, per
-- principle #15 ("every table belonging to an organization must carry
-- organization_id"). Rows with no organization_id (e.g. system-level events)
-- are only visible to service_role.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  user_id uuid references auth.users(id) on delete set null,
  ip inet,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_org on public.audit_logs (organization_id);
create index idx_audit_logs_table_record on public.audit_logs (table_name, record_id);
create index idx_audit_logs_created on public.audit_logs (created_at desc);

create trigger trg_audit_logs_no_update
  before update on public.audit_logs
  for each row execute function public.forbid_modify();

create trigger trg_audit_logs_no_delete
  before delete on public.audit_logs
  for each row execute function public.forbid_modify();

-- organization_settings: key/value config per organization (no real secrets)
create table public.organization_settings (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, key)
);

create trigger trg_organization_settings_updated_at
  before update on public.organization_settings
  for each row execute function public.set_updated_at();

-- Views (security_invoker so RLS of the calling user is respected, not the view owner's)

create view public.v_dashboard_metrics
with (security_invoker = true)
as
select
  o.id as organization_id,
  (select count(*) from public.clients c where c.organization_id = o.id and c.deleted_at is null and c.status = 'active') as active_clients,
  (select count(*) from public.projects p where p.organization_id = o.id and p.deleted_at is null and p.status = 'active') as active_projects,
  (select count(*) from public.tickets t where t.organization_id = o.id and t.deleted_at is null and t.status not in ('resolved','closed','cancelled')) as open_tickets,
  (select count(*) from public.tasks tk where tk.organization_id = o.id and tk.deleted_at is null and tk.status not in ('done','cancelled')) as open_tasks,
  (select coalesce(sum(i.amount_due), 0) from public.invoices i where i.organization_id = o.id and i.status not in ('void','paid','refunded')) as outstanding_amount,
  (select count(*) from public.domains d where d.organization_id = o.id and d.deleted_at is null and d.expires_on is not null and d.expires_on <= (current_date + interval '30 days')) as domains_expiring_30d
from public.organizations o
where o.deleted_at is null;

create view public.v_upcoming_renewals
with (security_invoker = true)
as
select organization_id, client_id, 'domain'::text as entity_type, id as entity_id, domain_name::text as reference, expires_on
from public.domains
where deleted_at is null and expires_on is not null
union all
select organization_id, client_id, 'hosting_account'::text as entity_type, id as entity_id, provider_name as reference, expires_on
from public.hosting_accounts
where deleted_at is null and expires_on is not null
union all
select organization_id, client_id, 'email_service'::text as entity_type, id as entity_id, provider_name as reference, expires_on
from public.email_services
where deleted_at is null and expires_on is not null
union all
select organization_id, client_id, 'client_service'::text as entity_type, id as entity_id, name_override as reference, next_billing_date as expires_on
from public.client_services
where deleted_at is null and next_billing_date is not null;

create view public.v_invoice_balances
with (security_invoker = true)
as
select
  i.id as invoice_id,
  i.organization_id,
  i.client_id,
  c.display_name as client_name,
  i.invoice_number,
  i.status,
  i.currency_code,
  i.total,
  i.amount_paid,
  i.amount_due,
  i.due_date
from public.invoices i
join public.clients c on c.id = i.client_id
where i.status <> 'void';

create view public.v_client_summary
with (security_invoker = true)
as
select
  c.id as client_id,
  c.organization_id,
  c.display_name,
  c.status,
  (select count(*) from public.projects p where p.client_id = c.id and p.deleted_at is null) as project_count,
  (select count(*) from public.tickets t where t.client_id = c.id and t.deleted_at is null and t.status not in ('resolved','closed','cancelled')) as open_ticket_count,
  (select coalesce(sum(i.total), 0) from public.invoices i where i.client_id = c.id and i.status <> 'void') as total_invoiced,
  (select coalesce(sum(i.amount_paid), 0) from public.invoices i where i.client_id = c.id and i.status <> 'void') as total_paid,
  (select coalesce(sum(i.amount_due), 0) from public.invoices i where i.client_id = c.id and i.status <> 'void') as total_outstanding
from public.clients c
where c.deleted_at is null;
