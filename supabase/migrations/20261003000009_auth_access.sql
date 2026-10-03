-- 0009 Auth and access: what the signed-in user can reach, session revocation,
-- venue provisioning with a starter role set, and RLS performance fixes.

-- ---------------------------------------------------------------------------
-- RLS performance: evaluate auth.uid() once per statement, not per row, and
-- merge overlapping permissive policies (Supabase advisor: auth_rls_initplan,
-- multiple_permissive_policies). Behaviour is unchanged.
-- ---------------------------------------------------------------------------

drop policy own_membership_select on public.memberships;
drop policy tenant_select on public.memberships;
create policy tenant_select on public.memberships for select to authenticated
  using (venue_id in (select app.venue_ids()) or user_id = (select auth.uid()));

drop policy owner_update on public.tasks;
drop policy tenant_update on public.tasks;
create policy tenant_update on public.tasks for update to authenticated
  using (app.can(venue_id, 'tasks.manage')
         or (owner_user_id = (select auth.uid()) and venue_id in (select app.member_venue_ids())))
  with check (app.can(venue_id, 'tasks.manage')
         or (owner_user_id = (select auth.uid()) and venue_id in (select app.member_venue_ids())));

drop policy org_update on public.organisations;
create policy org_update on public.organisations for update to authenticated
  using (id in (select o.organisation_id from public.org_memberships o
                where o.user_id = (select auth.uid()) and o.is_group_owner and o.archived_at is null));

drop policy profile_insert on public.profiles;
drop policy profile_update on public.profiles;
create policy profile_insert on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profile_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy org_membership_select on public.org_memberships;
create policy org_membership_select on public.org_memberships for select to authenticated
  using (user_id = (select auth.uid()));

drop policy own_comment_only on public.task_comments;
create policy own_comment_only on public.task_comments as restrictive
  for insert to authenticated with check (created_by = (select auth.uid()));

drop policy own_acknowledgement_only on public.process_acknowledgements;
create policy own_acknowledgement_only on public.process_acknowledgements as restrictive
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy own_request_only on public.approvals;
drop policy approver_decides on public.approvals;
create policy own_request_only on public.approvals as restrictive
  for insert to authenticated with check (requested_by = (select auth.uid()) and decision = 'pending');
create policy approver_decides on public.approvals as restrictive
  for update to authenticated
  using (app.can(venue_id, 'compliance.sign_off'))
  with check (app.can(venue_id, 'compliance.sign_off') and (decided_by is null or decided_by = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- What the signed-in user can reach. Exposed to the API; runs as the caller,
-- so RLS decides what comes back.
-- ---------------------------------------------------------------------------

create or replace function public.my_venues()
returns table (
  venue_id          uuid,
  organisation_id   uuid,
  slug              text,
  name              text,
  role_name         text,
  capabilities      text[],
  membership_status text,
  is_group_owner    boolean
)
language sql stable security invoker set search_path = '' as $$
  select v.id, v.organisation_id, v.slug, v.name,
         r.name,
         coalesce(case when m.status = 'active' then r.capabilities end, '{}'),
         m.status,
         exists (select 1 from public.org_memberships o
                 where o.organisation_id = v.organisation_id and o.user_id = (select auth.uid())
                   and o.is_group_owner and o.archived_at is null)
  from public.venues v
  left join public.memberships m on m.venue_id = v.id and m.user_id = (select auth.uid()) and m.archived_at is null
  left join public.roles r on r.id = m.role_id
  where v.archived_at is null
  order by v.name
$$;

create or replace function public.has_capability(p_venue_id uuid, p_capability text)
returns boolean
language sql stable security invoker set search_path = '' as $$
  select app.can(p_venue_id, p_capability)
$$;

-- ---------------------------------------------------------------------------
-- Remote sign-out. A manager with users.manage can revoke every session of a
-- person they have suspended at their venue (their refresh tokens stop working;
-- RLS already blocks the venue's data from the moment of suspension).
-- ---------------------------------------------------------------------------

create or replace function app.revoke_user_sessions(p_user_id uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  if not exists (
    select 1 from public.memberships m
    where m.user_id = p_user_id and m.status = 'suspended' and m.archived_at is null
      and app.can(m.venue_id, 'users.manage')
  ) then
    raise exception 'can only sign out people suspended at a venue you manage' using errcode = '42501';
  end if;
  delete from auth.sessions s where s.user_id = p_user_id;
  get diagnostics n = row_count;
  insert into public.audit_log (organisation_id, venue_id, table_name, record_id, action, actor_user_id, after)
  select m.organisation_id, m.venue_id, 'auth.sessions', p_user_id::text, 'delete', auth.uid(),
         jsonb_build_object('revoked_sessions', n)
  from public.memberships m
  where m.user_id = p_user_id and m.status = 'suspended' and app.can(m.venue_id, 'users.manage');
  return n;
end $$;

create or replace function public.revoke_user_sessions(p_user_id uuid) returns int
language sql volatile security invoker set search_path = '' as $$
  select app.revoke_user_sessions(p_user_id)
$$;

-- ---------------------------------------------------------------------------
-- Venue provisioning (platform only: SQL editor, seed, service role).
-- New venues get the starter roles below as ordinary, editable venue data.
-- ---------------------------------------------------------------------------

create or replace function app.provision_venue(
  p_org_slug     text,
  p_org_name     text,
  p_venue_slug   text,
  p_venue_name   text,
  p_timezone     text,
  p_jurisdiction text,
  p_licensee     text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_org   uuid;
  v_venue uuid;
  v_admin uuid;
  all_caps text[] := (select array_agg(key order by key) from public.capabilities);
begin
  insert into public.organisations (name, slug) values (p_org_name, p_org_slug)
  on conflict (slug) do update set name = public.organisations.name
  returning id into v_org;

  insert into public.venues (organisation_id, name, slug, licensee_entity_name)
  values (v_org, p_venue_name, p_venue_slug, p_licensee)
  returning id into v_venue;

  insert into public.roles (venue_id, name, capabilities, sort)
  select v_venue, r.name, r.caps, r.sort
  from (values
    ('Admin', all_caps, 0),
    ('Licensed Duty Manager', array[
      'checklist.run', 'checklist.close_out', 'venue.close', 'shifts.manage', 'handover.write',
      'tasks.manage', 'functions.manage', 'incidents.log', 'incidents.view_restricted',
      'maintenance.log', 'compliance.sign_off', 'reports.view'], 1),
    ('Non-closing Manager', array[
      'checklist.run', 'checklist.close_out', 'shifts.manage', 'handover.write', 'tasks.manage',
      'functions.manage', 'incidents.log', 'maintenance.log', 'reports.view'], 2),
    ('Shift Supervisor', array[
      'checklist.run', 'checklist.close_out', 'handover.write', 'incidents.log', 'maintenance.log'], 3),
    ('Department Lead', array[
      'checklist.run', 'checklist.close_out', 'templates.manage', 'tasks.manage', 'maintenance.log'], 4),
    ('Staff', array['checklist.run', 'maintenance.log'], 5),
    ('Read Only', array['reports.view'], 6)
  ) as r(name, caps, sort);

  select id into v_admin from public.roles where venue_id = v_venue and name = 'Admin';

  insert into public.venue_settings (venue_id, timezone, jurisdiction, nominated_approver_role_id)
  values (v_venue, p_timezone, p_jurisdiction, v_admin);

  return v_venue;
end $$;

-- Give an existing user (they've signed in once) a role at a venue.
create or replace function app.grant_membership(p_email text, p_venue_slug text, p_role_name text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user  uuid;
  v_venue uuid;
  v_role  uuid;
  v_id    uuid;
begin
  select id into v_user from public.profiles where lower(email) = lower(p_email);
  if v_user is null then
    raise exception 'no profile for % (they need to sign in once first)', p_email;
  end if;
  select id into v_venue from public.venues where slug = p_venue_slug;
  select id into v_role from public.roles where venue_id = v_venue and name = p_role_name;
  if v_role is null then
    raise exception 'no role % at venue %', p_role_name, p_venue_slug;
  end if;
  insert into public.memberships (venue_id, user_id, role_id)
  values (v_venue, v_user, v_role)
  on conflict (venue_id, user_id) do update set role_id = excluded.role_id, status = 'active', archived_at = null
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function app.provision_venue(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function app.grant_membership(text, text, text) from public, anon, authenticated;
revoke execute on function app.revoke_user_sessions(uuid) from public, anon;
grant execute on function app.revoke_user_sessions(uuid) to authenticated;
revoke execute on function public.my_venues(), public.has_capability(uuid, text), public.revoke_user_sessions(uuid) from public, anon;
grant execute on function public.my_venues(), public.has_capability(uuid, text), public.revoke_user_sessions(uuid) to authenticated;
