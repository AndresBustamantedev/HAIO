-- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  start_date date,
  completed_at timestamptz,
  estimated_minutes integer check (estimated_minutes >= 0),
  actual_minutes integer check (actual_minutes >= 0),
  position integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_tasks_org_status on public.tasks (organization_id, status) where deleted_at is null;
create index idx_tasks_project_status on public.tasks (project_id, status);
create index idx_tasks_assigned on public.tasks (assigned_to);

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- task_comments
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  content text not null,
  is_internal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_task_comments_task on public.task_comments (task_id, created_at);

create trigger trg_task_comments_updated_at
  before update on public.task_comments
  for each row execute function public.set_updated_at();

-- tickets
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  ticket_number text not null,
  subject text not null,
  description text,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'normal',
  requester_user_id uuid references auth.users(id) on delete set null,
  contact_id uuid references public.client_contacts(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, ticket_number)
);

create index idx_tickets_org_status on public.tickets (organization_id, status) where deleted_at is null;
create index idx_tickets_client_status on public.tickets (client_id, status);
create index idx_tickets_assigned on public.tickets (assigned_to);

create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- ticket_messages
create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_contact_id uuid references public.client_contacts(id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (author_user_id is not null or author_contact_id is not null)
);

create index idx_ticket_messages_ticket on public.ticket_messages (ticket_id, created_at);

create trigger trg_ticket_messages_updated_at
  before update on public.ticket_messages
  for each row execute function public.set_updated_at();

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null default 'system',
  title text not null,
  body text,
  url text,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index idx_notifications_user_unread on public.notifications (user_id) where read_at is null;
create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

-- notification_deliveries
create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel notification_channel not null default 'in_app',
  status text not null default 'pending',
  provider text,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_notification_deliveries_notification on public.notification_deliveries (notification_id);

-- email_messages: transactional emails sent by the app (no SMTP credentials here)
create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  client_id uuid references public.clients(id) on delete set null,
  to_addresses text[] not null,
  cc_addresses text[] not null default '{}',
  bcc_addresses text[] not null default '{}',
  subject text not null,
  body text,
  provider text,
  status text not null default 'queued',
  related_entity_type text,
  related_entity_id uuid,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_email_messages_org on public.email_messages (organization_id, created_at desc);

create trigger trg_email_messages_updated_at
  before update on public.email_messages
  for each row execute function public.set_updated_at();
