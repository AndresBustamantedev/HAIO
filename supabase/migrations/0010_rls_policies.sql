-- Enable RLS on every public table
do $$
declare
  t text;
begin
  foreach t in array array[
    'organizations','organization_members','profiles','clients','client_contacts','client_portal_access',
    'projects','services','client_services','domains','hosting_accounts','email_services','email_accounts',
    'credentials','credential_access_logs','sequences','quotes','quote_items','invoices','invoice_items',
    'payments','subscriptions','documents','backup_configurations','backup_records','tasks','task_comments',
    'tickets','ticket_messages','notifications','notification_deliveries','email_messages','activity_logs',
    'audit_logs','organization_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Generic staff CRUD policies for tables that have a direct organization_id column
-- and no client-portal exposure.
do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('client_contacts',       '{owner,admin,manager,member,viewer}', '{owner,admin,manager,member}', '{owner,admin}'),
      ('services',               '{owner,admin,manager,member,viewer}', '{owner,admin,manager}',        '{owner,admin}'),
      ('client_services',        '{owner,admin,manager,member,viewer}', '{owner,admin,manager,member}', '{owner,admin}'),
      ('domains',                '{owner,admin,manager,member,viewer}', '{owner,admin,manager,member}', '{owner,admin}'),
      ('hosting_accounts',       '{owner,admin,manager,member,viewer}', '{owner,admin,manager,member}', '{owner,admin}'),
      ('email_services',         '{owner,admin,manager,member,viewer}', '{owner,admin,manager,member}', '{owner,admin}'),
      ('email_accounts',         '{owner,admin,manager,member,viewer}', '{owner,admin,manager,member}', '{owner,admin}'),
      ('tasks',                  '{owner,admin,manager,member,viewer}', '{owner,admin,manager,member}', '{owner,admin}'),
      ('backup_configurations',  '{owner,admin,manager,viewer}',        '{owner,admin,manager}',        '{owner,admin}'),
      ('subscriptions',          '{owner,admin,manager,viewer}',        '{owner,admin,manager}',        '{owner,admin}'),
      ('payments',               '{owner,admin,manager,viewer}',        '{owner,admin,manager}',        '{owner,admin}'),
      ('credentials',            '{owner,admin,manager}',               '{owner,admin,manager}',        '{owner,admin}'),
      ('email_messages',         '{owner,admin,manager,viewer}',        '{owner,admin,manager}',        '{owner,admin}'),
      ('organization_settings',  '{owner,admin,manager,viewer}',        '{owner,admin}',                '{owner,admin}')
    ) as x(table_name, select_roles, write_roles, delete_roles)
  loop
    execute format(
      'create policy %I on public.%I for select using (public.has_organization_role(organization_id, %L::organization_role[]));',
      rec.table_name || '_select_staff', rec.table_name, rec.select_roles);
    execute format(
      'create policy %I on public.%I for insert with check (public.has_organization_role(organization_id, %L::organization_role[]));',
      rec.table_name || '_insert_staff', rec.table_name, rec.write_roles);
    execute format(
      'create policy %I on public.%I for update using (public.has_organization_role(organization_id, %L::organization_role[])) with check (public.has_organization_role(organization_id, %L::organization_role[]));',
      rec.table_name || '_update_staff', rec.table_name, rec.write_roles, rec.write_roles);
    execute format(
      'create policy %I on public.%I for delete using (public.has_organization_role(organization_id, %L::organization_role[]));',
      rec.table_name || '_delete_staff', rec.table_name, rec.delete_roles);
  end loop;
end $$;

-- organizations
create policy organizations_select_members
  on public.organizations for select
  using (public.has_organization_role(id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy organizations_insert_authenticated
  on public.organizations for insert
  with check (auth.uid() is not null);

create policy organizations_update_admins
  on public.organizations for update
  using (public.has_organization_role(id, '{owner,admin}'::organization_role[]))
  with check (public.has_organization_role(id, '{owner,admin}'::organization_role[]));

-- Bootstrap: whoever creates an organization becomes its owner member automatically.
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    insert into public.organization_members (organization_id, user_id, role, status, joined_at)
    values (new.id, auth.uid(), 'owner', 'active', now())
    on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

revoke all on function public.handle_new_organization() from public, anon, authenticated;

-- organization_members
create policy organization_members_select
  on public.organization_members for select
  using (
    public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[])
    or user_id = auth.uid()
  );

create policy organization_members_insert_admins
  on public.organization_members for insert
  with check (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

create policy organization_members_update_admins
  on public.organization_members for update
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

create policy organization_members_delete_admins
  on public.organization_members for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- profiles
create policy profiles_select_self_or_coworker
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.organization_members m1
      join public.organization_members m2 on m2.organization_id = m1.organization_id
      where m1.user_id = auth.uid() and m1.status = 'active'
        and m2.user_id = profiles.id and m2.status = 'active'
    )
  );

create policy profiles_update_self
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_insert_self
  on public.profiles for insert
  with check (id = auth.uid());

-- clients (staff + client-portal self access)
create policy clients_select_staff
  on public.clients for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy clients_select_portal
  on public.clients for select
  using (exists (
    select 1 from public.client_portal_access pa
    where pa.client_id = clients.id and pa.user_id = auth.uid()
  ));

create policy clients_insert_staff
  on public.clients for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy clients_update_staff
  on public.clients for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy clients_delete_staff
  on public.clients for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- client_portal_access
create policy client_portal_access_select_staff
  on public.client_portal_access for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy client_portal_access_select_self
  on public.client_portal_access for select
  using (user_id = auth.uid());

create policy client_portal_access_insert_staff
  on public.client_portal_access for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy client_portal_access_update_staff
  on public.client_portal_access for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy client_portal_access_delete_staff
  on public.client_portal_access for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- projects (staff + portal when authorized)
create policy projects_select_staff
  on public.projects for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy projects_select_portal
  on public.projects for select
  using (exists (
    select 1 from public.client_portal_access pa
    where pa.client_id = projects.client_id and pa.user_id = auth.uid() and pa.can_view_projects
  ));

create policy projects_insert_staff
  on public.projects for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy projects_update_staff
  on public.projects for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy projects_delete_staff
  on public.projects for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- quotes (staff + portal read)
create policy quotes_select_staff
  on public.quotes for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,viewer}'::organization_role[]));

create policy quotes_select_portal
  on public.quotes for select
  using (exists (
    select 1 from public.client_portal_access pa
    where pa.client_id = quotes.client_id and pa.user_id = auth.uid()
  ));

create policy quotes_insert_staff
  on public.quotes for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy quotes_update_staff
  on public.quotes for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy quotes_delete_staff
  on public.quotes for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- quote_items (through parent quote)
create policy quote_items_select
  on public.quote_items for select
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id
      and (
        public.has_organization_role(q.organization_id, '{owner,admin,manager,viewer}'::organization_role[])
        or exists (select 1 from public.client_portal_access pa where pa.client_id = q.client_id and pa.user_id = auth.uid())
      )
  ));

create policy quote_items_write
  on public.quote_items for all
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id
      and public.has_organization_role(q.organization_id, '{owner,admin,manager}'::organization_role[])
  ))
  with check (exists (
    select 1 from public.quotes q
    where q.id = quote_items.quote_id
      and public.has_organization_role(q.organization_id, '{owner,admin,manager}'::organization_role[])
  ));

-- invoices (staff + portal read; delete only drafts)
create policy invoices_select_staff
  on public.invoices for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,viewer}'::organization_role[]));

create policy invoices_select_portal
  on public.invoices for select
  using (
    status <> 'draft'
    and exists (
      select 1 from public.client_portal_access pa
      where pa.client_id = invoices.client_id and pa.user_id = auth.uid() and pa.can_view_invoices
    )
  );

create policy invoices_insert_staff
  on public.invoices for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy invoices_update_staff
  on public.invoices for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager}'::organization_role[]));

create policy invoices_delete_draft_only
  on public.invoices for delete
  using (
    public.has_organization_role(organization_id, '{owner,admin}'::organization_role[])
    and status = 'draft'
  );

-- invoice_items (through parent invoice)
create policy invoice_items_select
  on public.invoice_items for select
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id
      and (
        public.has_organization_role(i.organization_id, '{owner,admin,manager,viewer}'::organization_role[])
        or (
          i.status <> 'draft'
          and exists (
            select 1 from public.client_portal_access pa
            where pa.client_id = i.client_id and pa.user_id = auth.uid() and pa.can_view_invoices
          )
        )
      )
  ));

create policy invoice_items_write
  on public.invoice_items for all
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id
      and public.has_organization_role(i.organization_id, '{owner,admin,manager}'::organization_role[])
  ))
  with check (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id
      and public.has_organization_role(i.organization_id, '{owner,admin,manager}'::organization_role[])
  ));

-- documents (staff + portal when explicitly visible)
create policy documents_select_staff
  on public.documents for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy documents_select_portal
  on public.documents for select
  using (
    is_visible_to_client
    and client_id is not null
    and exists (
      select 1 from public.client_portal_access pa
      where pa.client_id = documents.client_id and pa.user_id = auth.uid() and pa.can_view_documents
    )
  );

create policy documents_insert_staff
  on public.documents for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy documents_update_staff
  on public.documents for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy documents_delete_staff
  on public.documents for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- backup_records (through parent configuration)
create policy backup_records_select
  on public.backup_records for select
  using (exists (
    select 1 from public.backup_configurations bc
    where bc.id = backup_records.backup_configuration_id
      and public.has_organization_role(bc.organization_id, '{owner,admin,manager,viewer}'::organization_role[])
  ));

create policy backup_records_write
  on public.backup_records for all
  using (exists (
    select 1 from public.backup_configurations bc
    where bc.id = backup_records.backup_configuration_id
      and public.has_organization_role(bc.organization_id, '{owner,admin,manager}'::organization_role[])
  ))
  with check (exists (
    select 1 from public.backup_configurations bc
    where bc.id = backup_records.backup_configuration_id
      and public.has_organization_role(bc.organization_id, '{owner,admin,manager}'::organization_role[])
  ));

-- task_comments (through parent task)
create policy task_comments_select
  on public.task_comments for select
  using (exists (
    select 1 from public.tasks tk
    where tk.id = task_comments.task_id
      and public.has_organization_role(tk.organization_id, '{owner,admin,manager,member,viewer}'::organization_role[])
  ));

create policy task_comments_insert
  on public.task_comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.tasks tk
      where tk.id = task_comments.task_id
        and public.has_organization_role(tk.organization_id, '{owner,admin,manager,member}'::organization_role[])
    )
  );

create policy task_comments_update
  on public.task_comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy task_comments_delete
  on public.task_comments for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.tasks tk
      where tk.id = task_comments.task_id
        and public.has_organization_role(tk.organization_id, '{owner,admin}'::organization_role[])
    )
  );

-- tickets (staff + portal)
create policy tickets_select_staff
  on public.tickets for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy tickets_select_portal
  on public.tickets for select
  using (
    requester_user_id = auth.uid()
    or exists (
      select 1 from public.client_portal_access pa
      where pa.client_id = tickets.client_id and pa.user_id = auth.uid() and pa.can_create_tickets
    )
  );

create policy tickets_insert_staff
  on public.tickets for insert
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy tickets_insert_portal
  on public.tickets for insert
  with check (
    requester_user_id = auth.uid()
    and exists (
      select 1 from public.client_portal_access pa
      where pa.client_id = tickets.client_id and pa.user_id = auth.uid() and pa.can_create_tickets
    )
  );

create policy tickets_update_staff
  on public.tickets for update
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]))
  with check (public.has_organization_role(organization_id, '{owner,admin,manager,member}'::organization_role[]));

create policy tickets_delete_staff
  on public.tickets for delete
  using (public.has_organization_role(organization_id, '{owner,admin}'::organization_role[]));

-- ticket_messages (staff full, portal non-internal only)
create policy ticket_messages_select_staff
  on public.ticket_messages for select
  using (exists (
    select 1 from public.tickets t
    where t.id = ticket_messages.ticket_id
      and public.has_organization_role(t.organization_id, '{owner,admin,manager,member,viewer}'::organization_role[])
  ));

create policy ticket_messages_select_portal
  on public.ticket_messages for select
  using (
    not is_internal
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and (
          t.requester_user_id = auth.uid()
          or exists (
            select 1 from public.client_portal_access pa
            where pa.client_id = t.client_id and pa.user_id = auth.uid() and pa.can_create_tickets
          )
        )
    )
  );

create policy ticket_messages_insert_staff
  on public.ticket_messages for insert
  with check (
    author_user_id = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and public.has_organization_role(t.organization_id, '{owner,admin,manager,member}'::organization_role[])
    )
  );

create policy ticket_messages_insert_portal
  on public.ticket_messages for insert
  with check (
    not is_internal
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and (
          t.requester_user_id = auth.uid()
          or exists (
            select 1 from public.client_portal_access pa
            where pa.client_id = t.client_id and pa.user_id = auth.uid() and pa.can_create_tickets
          )
        )
    )
  );

-- notifications (own rows only; created by server/service_role)
create policy notifications_select_self
  on public.notifications for select
  using (user_id = auth.uid());

create policy notifications_update_self
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notification_deliveries (visible through owning notification; written by server)
create policy notification_deliveries_select_self
  on public.notification_deliveries for select
  using (exists (
    select 1 from public.notifications n
    where n.id = notification_deliveries.notification_id and n.user_id = auth.uid()
  ));

-- credential_access_logs (append-only; insertable by credential managers, readable by admins)
create policy credential_access_logs_insert
  on public.credential_access_logs for insert
  with check (exists (
    select 1 from public.credentials c
    where c.id = credential_access_logs.credential_id
      and public.has_organization_role(c.organization_id, '{owner,admin,manager}'::organization_role[])
  ));

create policy credential_access_logs_select_admins
  on public.credential_access_logs for select
  using (exists (
    select 1 from public.credentials c
    where c.id = credential_access_logs.credential_id
      and public.has_organization_role(c.organization_id, '{owner,admin}'::organization_role[])
  ));

-- sequences (read-only for staff; writes only via next_sequence_value(), a security definer function)
create policy sequences_select_staff
  on public.sequences for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,viewer}'::organization_role[]));

-- activity_logs (readable + writable by staff, immutable by omission of update/delete policies)
create policy activity_logs_select_staff
  on public.activity_logs for select
  using (public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[]));

create policy activity_logs_insert_staff
  on public.activity_logs for insert
  with check (
    public.has_organization_role(organization_id, '{owner,admin,manager,member,viewer}'::organization_role[])
    and (user_id is null or user_id = auth.uid())
  );

-- audit_logs (owner/admin only, append-only via trigger already in place)
create policy audit_logs_select_admins
  on public.audit_logs for select
  using (
    organization_id is not null
    and public.has_organization_role(organization_id, '{owner,admin}'::organization_role[])
  );
