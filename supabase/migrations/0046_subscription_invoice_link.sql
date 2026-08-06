-- Link invoices to the subscription that originated them.
-- Used by the cron job to detect existing draft invoices (idempotency) and by
-- the UI to show which subscriptions already have a pending invoice.

alter table public.invoices
  add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;

create index if not exists idx_invoices_subscription
  on public.invoices (subscription_id)
  where subscription_id is not null;
