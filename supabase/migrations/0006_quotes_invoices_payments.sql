-- sequences: numbering per organization/type/year
create table public.sequences (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sequence_type text not null,
  sequence_year integer not null,
  last_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (organization_id, sequence_type, sequence_year)
);

create or replace function public.next_sequence_value(org_id uuid, seq_type text, seq_year integer)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value bigint;
begin
  -- Only enforce the membership check for requests coming through PostgREST as an
  -- authenticated user. Direct administrative connections (migrations, seeds, the
  -- service role) have no auth.role() and are trusted.
  if auth.role() = 'authenticated'
     and not public.has_organization_role(org_id, '{owner,admin,manager}'::organization_role[]) then
    raise exception 'not authorized for organization %', org_id;
  end if;

  insert into public.sequences (organization_id, sequence_type, sequence_year, last_value)
  values (org_id, seq_type, seq_year, 1)
  on conflict (organization_id, sequence_type, sequence_year)
  do update set last_value = public.sequences.last_value + 1, updated_at = now()
  returning last_value into v_value;

  return v_value;
end;
$$;

revoke all on function public.next_sequence_value(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.next_sequence_value(uuid, text, integer) to authenticated, service_role;

-- quotes
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  quote_number text not null,
  status quote_status not null default 'draft',
  issue_date date not null default current_date,
  valid_until date,
  currency_code char(3) not null default 'EUR',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text,
  terms text,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, quote_number)
);

create index idx_quotes_org_status on public.quotes (organization_id, status) where deleted_at is null;
create index idx_quotes_org_client on public.quotes (organization_id, client_id);

create trigger trg_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- quote_items (line totals are generated so the client cannot forge them)
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  tax_rate numeric(5,2) not null default 21.00 check (tax_rate between 0 and 100),
  line_subtotal numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0), 2)) stored,
  line_tax numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0) * (tax_rate / 100.0), 2)) stored,
  line_total numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0) * (1 + tax_rate / 100.0), 2)) stored,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quote_items_quote on public.quote_items (quote_id, position);

create trigger trg_quote_items_updated_at
  before update on public.quote_items
  for each row execute function public.set_updated_at();

-- invoices (no physical delete once issued/paid: use status = 'void')
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  invoice_number text not null,
  status invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  currency_code char(3) not null default 'EUR',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  amount_due numeric(12,2) not null default 0 check (amount_due >= 0),
  notes text,
  sent_at timestamptz,
  viewed_at timestamptz,
  paid_at timestamptz,
  external_provider text,
  external_id text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);

create index idx_invoices_org_status on public.invoices (organization_id, status);
create index idx_invoices_org_due on public.invoices (organization_id, due_date);
create index idx_invoices_org_client on public.invoices (organization_id, client_id);
create index idx_invoices_amount_due on public.invoices (organization_id) where amount_due > 0;

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- invoice_items (same shape as quote_items)
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  tax_rate numeric(5,2) not null default 21.00 check (tax_rate between 0 and 100),
  line_subtotal numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0), 2)) stored,
  line_tax numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0) * (tax_rate / 100.0), 2)) stored,
  line_total numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0) * (1 + tax_rate / 100.0), 2)) stored,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoice_items_invoice on public.invoice_items (invoice_id, position);

create trigger trg_invoice_items_updated_at
  before update on public.invoice_items
  for each row execute function public.set_updated_at();

-- payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  status payment_status not null default 'pending',
  method payment_method_type not null default 'other',
  amount numeric(12,2) not null check (amount >= 0),
  currency_code char(3) not null default 'EUR',
  paid_at timestamptz,
  reference text,
  external_provider text,
  external_id text,
  failure_reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_payments_external on public.payments (external_provider, external_id)
  where external_id is not null;
create index idx_payments_org_client on public.payments (organization_id, client_id);
create index idx_payments_invoice on public.payments (invoice_id);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- subscriptions (billing-facing view of a recurring client_service)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  client_service_id uuid references public.client_services(id) on delete set null,
  status subscription_status not null default 'active',
  amount numeric(12,2) not null check (amount >= 0),
  currency_code char(3) not null default 'EUR',
  billing_interval billing_interval not null default 'monthly',
  current_period_start date,
  current_period_end date,
  cancel_at timestamptz,
  cancelled_at timestamptz,
  external_provider text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_subscriptions_external on public.subscriptions (external_provider, external_id)
  where external_id is not null;
create index idx_subscriptions_org_client on public.subscriptions (organization_id, client_id);
create index idx_subscriptions_org_status on public.subscriptions (organization_id, status);

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Recalculation: quote totals from quote_items
create or replace function public.recalculate_quote_totals(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quotes q
  set subtotal = coalesce(agg.subtotal, 0),
      tax_amount = coalesce(agg.tax_amount, 0),
      total = coalesce(agg.total, 0)
  from (
    select
      sum(line_subtotal) as subtotal,
      sum(line_tax) as tax_amount,
      sum(line_total) as total
    from public.quote_items
    where quote_id = p_quote_id
  ) agg
  where q.id = p_quote_id;
end;
$$;

create or replace function public.trg_recalculate_quote_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_quote_totals(coalesce(new.quote_id, old.quote_id));
  return null;
end;
$$;

create trigger trg_quote_items_recalculate
  after insert or update or delete on public.quote_items
  for each row execute function public.trg_recalculate_quote_totals();

-- Recalculation: invoice totals from invoice_items, and paid/due from payments
create or replace function public.recalculate_invoice_totals(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invoices i
  set subtotal = coalesce(agg.subtotal, 0),
      tax_amount = coalesce(agg.tax_amount, 0),
      total = coalesce(agg.total, 0),
      amount_due = greatest(coalesce(agg.total, 0) - i.amount_paid, 0)
  from (
    select
      sum(line_subtotal) as subtotal,
      sum(line_tax) as tax_amount,
      sum(line_total) as total
    from public.invoice_items
    where invoice_id = p_invoice_id
  ) agg
  where i.id = p_invoice_id;
end;
$$;

create or replace function public.trg_recalculate_invoice_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_invoice_totals(coalesce(new.invoice_id, old.invoice_id));
  return null;
end;
$$;

create trigger trg_invoice_items_recalculate
  after insert or update or delete on public.invoice_items
  for each row execute function public.trg_recalculate_invoice_totals();

-- Recalculation: invoice amount_paid/amount_due/status from succeeded payments
create or replace function public.recalculate_invoice_payment_state(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid numeric(12,2);
  v_total numeric(12,2);
begin
  select coalesce(sum(amount), 0) into v_paid
  from public.payments
  where invoice_id = p_invoice_id
    and status = 'succeeded';

  select total into v_total from public.invoices where id = p_invoice_id;

  update public.invoices
  set amount_paid = v_paid,
      amount_due = greatest(coalesce(v_total, 0) - v_paid, 0),
      paid_at = case when v_paid >= coalesce(v_total, 0) and coalesce(v_total, 0) > 0 then now() else paid_at end,
      status = case
        when status in ('void', 'refunded') then status
        when v_paid <= 0 then status
        when v_paid >= coalesce(v_total, 0) and coalesce(v_total, 0) > 0 then 'paid'
        when v_paid > 0 then 'partially_paid'
        else status
      end
  where id = p_invoice_id;
end;
$$;

create or replace function public.trg_recalculate_invoice_payment_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.invoice_id is not null then
      perform public.recalculate_invoice_payment_state(old.invoice_id);
    end if;
    return old;
  end if;

  if new.invoice_id is not null then
    perform public.recalculate_invoice_payment_state(new.invoice_id);
  end if;
  if tg_op = 'UPDATE' and old.invoice_id is not null and old.invoice_id is distinct from new.invoice_id then
    perform public.recalculate_invoice_payment_state(old.invoice_id);
  end if;
  return new;
end;
$$;

create trigger trg_payments_recalculate
  after insert or update or delete on public.payments
  for each row execute function public.trg_recalculate_invoice_payment_state();

-- These functions must only ever run as trigger callbacks, never as a direct RPC
-- call from anon/authenticated. Trigger firing does not require EXECUTE privilege.
revoke all on function public.recalculate_quote_totals(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_invoice_totals(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_invoice_payment_state(uuid) from public, anon, authenticated;
revoke all on function public.trg_recalculate_quote_totals() from public, anon, authenticated;
revoke all on function public.trg_recalculate_invoice_totals() from public, anon, authenticated;
revoke all on function public.trg_recalculate_invoice_payment_state() from public, anon, authenticated;
