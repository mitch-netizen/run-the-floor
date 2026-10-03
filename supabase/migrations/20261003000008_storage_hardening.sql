-- 0008 Storage buckets (venue-scoped paths) and final privilege hardening.

-- Object paths are always {venue_id}/... ; buckets are private.
insert into storage.buckets (id, name, public) values
  ('evidence',    'evidence',    false),   -- checklist photos, signatures, task proof
  ('sop-media',   'sop-media',   false),   -- process step photos and video
  ('attachments', 'attachments', false),   -- function attachments, incident photos
  ('imports',     'imports',     false)    -- uploaded SOP workbooks and roster CSVs
on conflict (id) do nothing;

create policy venue_objects_select on storage.objects for select to authenticated
  using (
    bucket_id in ('evidence', 'sop-media', 'attachments')
    and (storage.foldername(name))[1] in (select v::text from app.venue_ids() v)
  );

create policy venue_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id in ('evidence', 'sop-media', 'attachments')
    and (storage.foldername(name))[1] in (select v::text from app.member_venue_ids() v)
  );

create policy import_objects_select on storage.objects for select to authenticated
  using (
    bucket_id = 'imports'
    and exists (select 1 from app.member_venue_ids() v
                where v::text = (storage.foldername(name))[1] and app.can(v, 'imports.run'))
  );

create policy import_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imports'
    and exists (select 1 from app.member_venue_ids() v
                where v::text = (storage.foldername(name))[1] and app.can(v, 'imports.run'))
  );
-- No update or delete policies: evidence is never overwritten or removed.

-- Internal helpers are not callable by API roles.
revoke execute on function app.register_tenant_table(regclass, text) from public, anon, authenticated;
revoke execute on all functions in schema app from anon;

-- Belt and braces: anon has no access to any app table.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke delete, truncate on tables from authenticated, service_role;
