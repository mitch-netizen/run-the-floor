-- 0001 Tenancy, roles, audit and the shared machinery every tenant table uses.
--
-- Conventions (apply to every tenant table, enforced by app.register_tenant_table):
--   * organisation_id + venue_id NOT NULL, composite FK to venues(id, organisation_id)
--   * organisation_id is filled from venue_id on insert; venue/org can never change
--   * RLS on; reads limited to app.venue_ids(); writes need a capability
--   * no DELETE grant to any API role; rows are archived (archived_at) instead
--   * every insert/update is written to audit_log
--   * child rows reference parents by (id, venue_id) so links can't cross venues

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Generic trigger functions
-- ---------------------------------------------------------------------------

create or replace function app.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Organisations and venues
-- ---------------------------------------------------------------------------

create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz
);

create table public.venues (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid not null references public.organisations(id),
  name                  text not null,
  slug                  text not null unique check (slug ~ '^[a-z0-9-]+$'),
  -- The licensee is a company entity on the venue record, not an app user.
  licensee_entity_name  text,
  licence_number        text,
  address               text,
  branding              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  archived_at           timestamptz,
  unique (id, organisation_id)
);
create index on public.venues (organisation_id);

create table public.profiles (
  id          uuid primary key references auth.users(id),
  full_name   text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Group-level membership. Group owners can read every venue in the organisation.
create table public.org_memberships (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id),
  user_id         uuid not null references public.profiles(id),
  is_group_owner  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (organisation_id, user_id)
);
create index on public.org_memberships (user_id);

-- The fixed catalogue of what the software can do. Roles (venue data) grant these.
create table public.capabilities (
  key         text primary key,
  description text not null
);

insert into public.capabilities (key, description) values
  ('settings.manage',          'Edit venue settings, departments, areas, roles, rules and contacts'),
  ('users.manage',             'Invite, suspend and assign roles, departments and qualifications'),
  ('templates.manage',         'Create and publish checklist, run sheet and process templates'),
  ('checklist.run',            'Start and answer checklists'),
  ('checklist.close_out',      'Complete (close out) a checklist and resolve its exceptions'),
  ('venue.close',              'Be assigned as closer and sign the venue close-out'),
  ('shifts.manage',            'Create shifts and assign shift managers'),
  ('handover.write',           'Write and sign shift handovers'),
  ('tasks.manage',             'Create, assign and edit any task'),
  ('functions.manage',         'Create and edit functions and run sheets'),
  ('incidents.log',            'Log incidents'),
  ('incidents.view_restricted','View restricted incidents (exclusions, minors, gaming)'),
  ('maintenance.log',          'Log and update maintenance issues'),
  ('compliance.sign_off',      'Decide approvals as the nominated approver'),
  ('imports.run',              'Upload and commit SOP and roster imports'),
  ('audit.view',               'Read the audit log'),
  ('reports.view',             'View reports and dashboards');

-- ---------------------------------------------------------------------------
-- Venue-scoped configuration
-- ---------------------------------------------------------------------------

create table public.roles (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  capabilities    text[] not null default '{}',
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, name),
  unique (id, venue_id)
);

create table public.departments (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  owner_user_id   uuid references public.profiles(id),
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, name),
  unique (id, venue_id)
);

create table public.venue_areas (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  area_type       text,
  department_id   uuid,
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, name),
  unique (id, venue_id),
  foreign key (department_id, venue_id) references public.departments(id, venue_id)
);

create table public.venue_settings (
  venue_id                   uuid primary key,
  organisation_id            uuid not null,
  timezone                   text not null,
  jurisdiction               text not null,             -- e.g. AU-QLD
  trading_hours              jsonb not null default '{}'::jsonb,
  -- Activity before this local time belongs to the previous trading day.
  trading_day_cutover        time not null default '05:00',
  enabled_modules            text[] not null default '{}',
  nominated_approver_role_id uuid,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  foreign key (nominated_approver_role_id, venue_id) references public.roles(id, venue_id)
);

create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  user_id         uuid not null references public.profiles(id),
  role_id         uuid not null,
  department_id   uuid,
  status          text not null default 'active' check (status in ('active', 'suspended')),
  pin_hash        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, user_id),
  foreign key (role_id, venue_id) references public.roles(id, venue_id),
  foreign key (department_id, venue_id) references public.departments(id, venue_id)
);
create index on public.memberships (user_id);

create table public.qualification_types (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  warn_days       int[] not null default '{60,30}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, name),
  unique (id, venue_id)
);

create table public.staff_qualifications (
  id                    uuid primary key default gen_random_uuid(),
  organisation_id       uuid not null,
  venue_id              uuid not null,
  user_id               uuid not null references public.profiles(id),
  qualification_type_id uuid not null,
  number                text,
  expires_on            date,
  source                text not null default 'manual' check (source in ('manual', 'import')),
  import_batch_id       uuid,                           -- FK added with import_batches
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  archived_at           timestamptz,
  foreign key (qualification_type_id, venue_id) references public.qualification_types(id, venue_id)
);
create index on public.staff_qualifications (venue_id, user_id);

-- Compliance rules are data per venue and jurisdiction, never code.
create table public.compliance_rules (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  jurisdiction    text not null,
  rule_key        text not null,
  params          jsonb not null default '{}'::jsonb,
  active          boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, rule_key)
);

-- ---------------------------------------------------------------------------
-- Audit log (append only)
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id              bigint generated always as identity primary key,
  organisation_id uuid,
  venue_id        uuid,
  table_name      text not null,
  record_id       text not null,
  action          text not null check (action in ('insert', 'update', 'delete')),
  actor_user_id   uuid,
  before          jsonb,
  after           jsonb,
  created_at      timestamptz not null default now()
);
create index on public.audit_log (venue_id, created_at desc);
create index on public.audit_log (table_name, record_id);

create or replace function app.audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rec    jsonb := to_jsonb(coalesce(new, old));
  b      jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  a      jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  rec_id text  := coalesce(rec ->> 'id', rec ->> 'venue_id');
begin
  if tg_op = 'UPDATE' and b = a then
    return null;
  end if;
  insert into public.audit_log (organisation_id, venue_id, table_name, record_id, action, actor_user_id, before, after)
  values (
    (rec ->> 'organisation_id')::uuid,
    case when tg_table_name = 'venues' then (rec ->> 'id')::uuid else (rec ->> 'venue_id')::uuid end,
    tg_table_name,
    rec_id,
    lower(tg_op),
    auth.uid(),
    b,
    a
  );
  return null;
end $$;

create or replace function app.audit_log_is_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log is append only' using errcode = '42501';
end $$;

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function app.audit_log_is_append_only();

create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function app.audit_log_is_append_only();

-- ---------------------------------------------------------------------------
-- RLS helpers. SECURITY DEFINER so they can read memberships without recursion.
-- ---------------------------------------------------------------------------

-- Venues the current user can read: active memberships, plus every venue in an
-- organisation where they are a group owner.
create or replace function app.venue_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.venue_id
  from public.memberships m
  where m.user_id = auth.uid() and m.status = 'active' and m.archived_at is null
  union
  select v.id
  from public.venues v
  join public.org_memberships o on o.organisation_id = v.organisation_id
  where o.user_id = auth.uid() and o.is_group_owner and o.archived_at is null
$$;

-- Venues where the current user holds an active membership (write scope).
create or replace function app.member_venue_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.venue_id
  from public.memberships m
  where m.user_id = auth.uid() and m.status = 'active' and m.archived_at is null
$$;

-- Does the current user's role at this venue grant the capability?
create or replace function app.can(p_venue_id uuid, p_capability text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id and r.venue_id = m.venue_id
    where m.user_id = auth.uid()
      and m.venue_id = p_venue_id
      and m.status = 'active'
      and m.archived_at is null
      and r.archived_at is null
      and p_capability = any (r.capabilities)
  )
$$;

-- Does the user hold an unexpired qualification of the given type at the venue?
create or replace function app.has_qualification(p_user_id uuid, p_venue_id uuid, p_qualification_type_id uuid, p_on date)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.staff_qualifications q
    where q.user_id = p_user_id
      and q.venue_id = p_venue_id
      and q.qualification_type_id = p_qualification_type_id
      and q.archived_at is null
      and (q.expires_on is null or q.expires_on >= p_on)
  )
$$;

-- Profiles the current user may see: their own, and anyone sharing a venue.
create or replace function app.visible_user_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select auth.uid()
  union
  select m.user_id from public.memberships m
  where m.venue_id in (select app.venue_ids()) and m.archived_at is null
$$;

grant execute on all functions in schema app to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tenant guard: fill organisation_id, forbid moving rows between venues.
-- ---------------------------------------------------------------------------

create or replace function app.tenant_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_org uuid;
begin
  if tg_op = 'UPDATE' then
    if new.venue_id is distinct from old.venue_id or new.organisation_id is distinct from old.organisation_id then
      raise exception 'records cannot be moved between venues' using errcode = '42501';
    end if;
    return new;
  end if;

  select v.organisation_id into v_org from public.venues v where v.id = new.venue_id;
  if v_org is null then
    raise exception 'unknown venue %', new.venue_id using errcode = '23503';
  end if;
  if new.organisation_id is not null and new.organisation_id <> v_org then
    raise exception 'organisation does not match venue' using errcode = '42501';
  end if;
  new.organisation_id := v_org;
  return new;
end $$;

-- Validate role capabilities against the catalogue.
create or replace function app.validate_role_capabilities() returns trigger
language plpgsql set search_path = '' as $$
declare
  unknown text[];
begin
  select array_agg(c) into unknown
  from unnest(new.capabilities) c
  where not exists (select 1 from public.capabilities k where k.key = c);
  if unknown is not null then
    raise exception 'unknown capabilities: %', unknown using errcode = '23514';
  end if;
  return new;
end $$;

create trigger roles_validate_capabilities
  before insert or update of capabilities on public.roles
  for each row execute function app.validate_role_capabilities();

create or replace function app.validate_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'unknown timezone %', new.timezone using errcode = '23514';
  end if;
  return new;
end $$;

create trigger venue_settings_validate_timezone
  before insert or update of timezone on public.venue_settings
  for each row execute function app.validate_timezone();

-- ---------------------------------------------------------------------------
-- register_tenant_table: the one place the conventions are applied.
--
--   p_write_capability: capability needed to insert/update. NULL means any
--     active member of the venue may write (row-level rules are added by the
--     caller as extra restrictive policies where needed).
-- ---------------------------------------------------------------------------

create or replace function app.register_tenant_table(p_table regclass, p_write_capability text)
returns void
language plpgsql set search_path = '' as $$
declare
  t   text := p_table::text;
  rel text := (select c.relname from pg_catalog.pg_class c where c.oid = p_table);
  has_updated_at boolean := exists (
    select 1 from pg_catalog.pg_attribute a
    where a.attrelid = p_table and a.attname = 'updated_at' and not a.attisdropped
  );
  write_check text;
begin
  -- Every tenant table hangs off a venue, and the org must match that venue.
  execute format(
    'alter table %s add constraint %I foreign key (venue_id, organisation_id) references public.venues(id, organisation_id)',
    t, rel || '_venue_org_fkey');
  execute format('create index if not exists %I on %s (venue_id)', rel || '_venue_id_idx', t);

  execute format('create trigger tenant_guard before insert or update on %s for each row execute function app.tenant_guard()', t);
  execute format('create trigger audit after insert or update or delete on %s for each row execute function app.audit()', t);
  if has_updated_at then
    execute format('create trigger set_updated_at before update on %s for each row execute function app.set_updated_at()', t);
  end if;

  execute format('alter table %s enable row level security', t);
  execute format('revoke all on %s from anon', t);
  execute format('revoke delete, truncate on %s from authenticated, service_role', t);

  write_check := case
    when p_write_capability is null then 'venue_id in (select app.member_venue_ids())'
    else format('app.can(venue_id, %L)', p_write_capability)
  end;

  execute format('create policy tenant_select on %s for select to authenticated using (venue_id in (select app.venue_ids()))', t);
  execute format('create policy tenant_insert on %s for insert to authenticated with check (%s)', t, write_check);
  execute format('create policy tenant_update on %s for update to authenticated using (%s) with check (%s)', t, write_check, write_check);
end $$;

-- Locks a row once a condition holds (completed run, published version...).
-- Usage: create trigger ... before update on t for each row
--        when (<old row is locked>) execute function app.reject_locked();
create or replace function app.reject_locked() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% record is locked and cannot be changed', tg_table_name using errcode = '42501';
end $$;

-- ---------------------------------------------------------------------------
-- Register 0001 tenant tables
-- ---------------------------------------------------------------------------

select app.register_tenant_table('public.roles',                'settings.manage');
select app.register_tenant_table('public.departments',          'settings.manage');
select app.register_tenant_table('public.venue_areas',          'settings.manage');
select app.register_tenant_table('public.venue_settings',       'settings.manage');
select app.register_tenant_table('public.memberships',          'users.manage');
select app.register_tenant_table('public.qualification_types',  'settings.manage');
select app.register_tenant_table('public.staff_qualifications', 'users.manage');
select app.register_tenant_table('public.compliance_rules',     'settings.manage');

-- Members may read their own membership even if suspended (to show a message).
create policy own_membership_select on public.memberships
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Non-tenant tables: organisations, venues, profiles, org_memberships, capabilities, audit_log
-- ---------------------------------------------------------------------------

create trigger set_updated_at before update on public.organisations   for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.venues          for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.profiles        for each row execute function app.set_updated_at();
create trigger set_updated_at before update on public.org_memberships for each row execute function app.set_updated_at();

create trigger audit after insert or update or delete on public.organisations   for each row execute function app.audit();
create trigger audit after insert or update or delete on public.venues          for each row execute function app.audit();
create trigger audit after insert or update or delete on public.profiles        for each row execute function app.audit();
create trigger audit after insert or update or delete on public.org_memberships for each row execute function app.audit();

alter table public.organisations   enable row level security;
alter table public.venues          enable row level security;
alter table public.profiles        enable row level security;
alter table public.org_memberships enable row level security;
alter table public.capabilities    enable row level security;
alter table public.audit_log       enable row level security;

revoke all on public.organisations, public.venues, public.profiles, public.org_memberships,
              public.capabilities, public.audit_log from anon;
revoke delete, truncate on public.organisations, public.venues, public.profiles, public.org_memberships,
              public.capabilities, public.audit_log from authenticated, service_role;
-- Organisations, venues and group memberships are provisioned by the platform (service role).
revoke insert on public.organisations, public.venues, public.org_memberships from authenticated;
revoke insert, update on public.capabilities, public.audit_log from authenticated;
revoke update on public.org_memberships from authenticated;

create policy org_select on public.organisations for select to authenticated
  using (id in (select v.organisation_id from public.venues v where v.id in (select app.venue_ids())));
create policy org_update on public.organisations for update to authenticated
  using (id in (select o.organisation_id from public.org_memberships o
                where o.user_id = auth.uid() and o.is_group_owner and o.archived_at is null));

create policy venue_select on public.venues for select to authenticated
  using (id in (select app.venue_ids()));
create policy venue_update on public.venues for update to authenticated
  using (app.can(id, 'settings.manage')) with check (app.can(id, 'settings.manage'));

create policy profile_select on public.profiles for select to authenticated
  using (id in (select app.visible_user_ids()));
create policy profile_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profile_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy org_membership_select on public.org_memberships for select to authenticated
  using (user_id = auth.uid());

create policy capabilities_select on public.capabilities for select to authenticated using (true);

create policy audit_select on public.audit_log for select to authenticated
  using (venue_id is not null and app.can(venue_id, 'audit.view'));

-- New auth users get a profile row.
create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();
