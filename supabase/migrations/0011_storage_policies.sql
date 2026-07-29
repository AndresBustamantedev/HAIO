-- Buckets. All private; the app must issue signed URLs from the server.
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', false),
  ('organization-assets', 'organization-assets', false),
  ('client-documents', 'client-documents', false),
  ('project-files', 'project-files', false),
  ('invoice-files', 'invoice-files', false),
  ('backup-files', 'backup-files', false)
on conflict (id) do nothing;

-- avatars: path {user_id}/{filename}. Any signed-in user may view avatars; only the
-- owner may write their own.
create policy avatars_select_authenticated
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy avatars_write_owner
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- organization-assets: path {organization_id}/{filename}
create policy organization_assets_select_staff
  on storage.objects for select
  using (
    bucket_id = 'organization-assets'
    and public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin,manager,member,viewer}'::organization_role[])
  );

create policy organization_assets_write_staff
  on storage.objects for all
  using (
    bucket_id = 'organization-assets'
    and public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin,manager}'::organization_role[])
  )
  with check (
    bucket_id = 'organization-assets'
    and public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin,manager}'::organization_role[])
  );

-- client-documents, project-files, invoice-files: path {organization_id}/{client_id}/{document_id}/{filename}
do $$
declare
  b text;
begin
  foreach b in array array['client-documents', 'project-files', 'invoice-files']
  loop
    execute format(
      $p$create policy %I on storage.objects for select using (
        bucket_id = %L
        and (
          public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin,manager,member,viewer}'::organization_role[])
          or exists (
            select 1 from public.documents d
            where d.bucket_id = objects.bucket_id
              and d.storage_path = objects.name
              and d.is_visible_to_client
              and d.client_id is not null
              and exists (
                select 1 from public.client_portal_access pa
                where pa.client_id = d.client_id and pa.user_id = auth.uid() and pa.can_view_documents
              )
          )
        )
      );$p$,
      b || '_select', b);

    execute format(
      $p$create policy %I on storage.objects for insert with check (
        bucket_id = %L
        and public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin,manager,member}'::organization_role[])
      );$p$,
      b || '_insert', b);

    execute format(
      $p$create policy %I on storage.objects for update using (
        bucket_id = %L
        and public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin,manager,member}'::organization_role[])
      ) with check (
        bucket_id = %L
        and public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin,manager,member}'::organization_role[])
      );$p$,
      b || '_update', b, b);

    execute format(
      $p$create policy %I on storage.objects for delete using (
        bucket_id = %L
        and public.has_organization_role((storage.foldername(name))[1]::uuid, '{owner,admin}'::organization_role[])
      );$p$,
      b || '_delete', b);
  end loop;
end $$;

-- backup-files: no policies for authenticated/anon => only service_role (which bypasses RLS) can touch it.
