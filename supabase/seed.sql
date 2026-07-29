-- Development seed data. Run automatically by `supabase db reset` against your
-- local Supabase instance. Never run this against a production project.
--
-- No real personal data or secrets. The synthetic auth user below only makes
-- sense on a local, throwaway Postgres instance (it will not appear correctly
-- in a hosted project's Auth dashboard, since GoTrue also keeps its own
-- internal bookkeeping outside of what plain SQL can populate).

-- 1. A local-only test admin you can sign in with (email: admin@haio.dev / password: haio-dev-2026)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'admin@haio.dev',
  crypt('haio-dev-2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin HAIO","first_name":"Admin","last_name":"HAIO"}',
  now(),
  now(),
  '',
  ''
)
on conflict (id) do nothing;

-- 2. Organización HAIO + resto de datos de referencia
with org as (
  insert into public.organizations (name, slug, legal_name, email, country_code, currency_code, timezone)
  values ('HAIO', 'haio', 'HAIO Digital S.L.', 'hola@haio.dev', 'ES', 'EUR', 'Europe/Madrid')
  returning id
),
membership as (
  insert into public.organization_members (organization_id, user_id, role, status, joined_at)
  select id, '11111111-1111-1111-1111-111111111111', 'owner', 'active', now()
  from org
  on conflict (organization_id, user_id) do nothing
  returning organization_id
),
client as (
  insert into public.clients (organization_id, type, status, display_name, legal_name, email, city, country_code)
  select id, 'company', 'active', 'Acme Studio', 'Acme Studio S.L.', 'contacto@acmestudio.test', 'Madrid', 'ES'
  from org
  returning id, organization_id
),
contact as (
  insert into public.client_contacts (organization_id, client_id, full_name, job_title, email, is_primary, receives_billing)
  select organization_id, id, 'Marta Ruiz', 'CEO', 'marta@acmestudio.test', true, true
  from client
  returning id as contact_id, client_id
),
project as (
  insert into public.projects (organization_id, client_id, name, slug, type, status, production_url, budget, progress_percent)
  select c.organization_id, c.id, 'Acme Studio - Web corporativa', 'acme-web-corporativa', 'website', 'active', 'https://acmestudio.test', 3500.00, 40
  from client c
  returning id, organization_id, client_id
),
domain as (
  insert into public.domains (organization_id, client_id, project_id, domain_name, status, registrar_name, expires_on, renewal_price, auto_renew, managed_by_us)
  select p.organization_id, p.client_id, p.id, 'acmestudio.test', 'active', 'OVH', current_date + interval '9 months', 14.99, true, true
  from project p
  returning organization_id, client_id, project_id
),
hosting as (
  insert into public.hosting_accounts (organization_id, client_id, project_id, provider_name, plan_name, status, expires_on, renewal_price, billing_interval, auto_renew)
  select organization_id, client_id, project_id, 'Vercel', 'Pro', 'active', current_date + interval '11 months', 240.00, 'annual', true
  from domain
  returning organization_id
),
svc_dev as (
  insert into public.services (organization_id, name, code, category, billing_type, default_price, tax_rate, description)
  select id, 'Desarrollo web a medida', 'DEV-WEB', 'development', 'one_time', 3500.00, 21.00, 'Desarrollo de sitio corporativo'
  from org
  returning id, organization_id
),
svc_maint as (
  insert into public.services (organization_id, name, code, category, billing_type, default_price, default_interval, tax_rate, description)
  select organization_id, 'Mantenimiento mensual', 'MAINT-MENS', 'maintenance', 'recurring', 90.00, 'monthly', 21.00, 'Actualizaciones, backups y soporte'
  from svc_dev
  returning id, organization_id
),
svc_hosting as (
  insert into public.services (organization_id, name, code, category, billing_type, default_price, default_interval, tax_rate, description)
  select organization_id, 'Hosting gestionado', 'HOST-GEST', 'hosting', 'recurring', 20.00, 'monthly', 21.00, 'Hosting en Vercel gestionado por HAIO'
  from svc_maint
  returning id, organization_id
),
cs as (
  insert into public.client_services (organization_id, client_id, project_id, service_id, status, unit_price, billing_interval, starts_on, next_billing_date, supplier_cost)
  select p.organization_id, p.client_id, p.id, sm.id, 'active', 90.00, 'monthly', current_date, (date_trunc('month', current_date) + interval '1 month')::date, 20.00
  from project p, svc_maint sm
  returning organization_id
),
seq_quote as (
  select public.next_sequence_value(org.id, 'quote', extract(year from current_date)::int) as n from org
),
quote as (
  insert into public.quotes (organization_id, client_id, project_id, quote_number, status, valid_until, notes)
  select p.organization_id, p.client_id, p.id, 'PRE-' || to_char(current_date, 'YYYY') || '-' || lpad((select n from seq_quote)::text, 4, '0'), 'accepted', current_date + interval '30 days', 'Presupuesto inicial del proyecto'
  from project p
  returning id, organization_id, client_id, project_id
),
quote_item as (
  insert into public.quote_items (quote_id, service_id, description, quantity, unit_price, tax_rate, position)
  select q.id, sd.id, 'Desarrollo web corporativa (pack inicial)', 1, 3500.00, 21.00, 1
  from quote q, svc_dev sd
  returning quote_id
),
seq_invoice as (
  select public.next_sequence_value(org.id, 'invoice', extract(year from current_date)::int) as n from org
),
invoice as (
  insert into public.invoices (organization_id, client_id, project_id, quote_id, invoice_number, status, due_date, sent_at)
  select q.organization_id, q.client_id, q.project_id, q.id, 'FAC-' || to_char(current_date, 'YYYY') || '-' || lpad((select n from seq_invoice)::text, 4, '0'), 'sent', current_date + interval '15 days', now()
  from quote q
  returning id, organization_id, client_id
),
invoice_item as (
  insert into public.invoice_items (invoice_id, service_id, description, quantity, unit_price, tax_rate, position)
  select i.id, sd.id, 'Desarrollo web corporativa (pack inicial)', 1, 3500.00, 21.00, 1
  from invoice i, svc_dev sd
  returning invoice_id
),
payment as (
  insert into public.payments (organization_id, client_id, invoice_id, status, method, amount, paid_at, reference)
  select i.organization_id, i.client_id, i.id, 'succeeded', 'bank_transfer', 1500.00, now(), 'Anticipo 40%'
  from invoice i
  returning organization_id
),
task as (
  insert into public.tasks (organization_id, client_id, project_id, title, description, status, priority, due_date, created_by, assigned_to)
  select p.organization_id, p.client_id, p.id, 'Maquetar página de inicio', 'Home + secciones principales según brief', 'in_progress', 'high', current_date + interval '5 days', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'
  from project p
  returning organization_id
),
ticket as (
  insert into public.tickets (organization_id, client_id, project_id, contact_id, ticket_number, subject, description, status, priority)
  select p.organization_id, p.client_id, p.id, (select contact_id from contact), 'TCK-' || to_char(current_date, 'YYYY') || '-0001', 'Cambiar logo de la cabecera', 'El cliente ha enviado un nuevo logo en alta resolución.', 'open', 'normal'
  from project p
  returning organization_id
),
notification as (
  insert into public.notifications (user_id, type, title, body, url)
  values ('11111111-1111-1111-1111-111111111111', 'ticket', 'Nuevo ticket abierto', 'Acme Studio ha abierto un ticket: "Cambiar logo de la cabecera".', '/tickets')
  returning id
)
select 'seed ok' as result;
