-- 0006 Incident register, maintenance log, key contacts / call tree, approvals.

create table public.incident_types (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  restricted      boolean not null default false,
  required_fields text[] not null default '{}',
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, name),
  unique (id, venue_id)
);

create table public.incidents (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null,
  venue_id         uuid not null,
  incident_type_id uuid not null,
  occurred_at      timestamptz not null,
  people           jsonb not null default '[]'::jsonb,
  description      text not null,
  action_taken     text,
  follow_up        text,
  severity         text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  status           text not null default 'open' check (status in ('open', 'follow_up', 'closed')),
  -- Copied from the type on insert so access can't change if the type is edited later.
  restricted       boolean not null default false,
  shift_id         uuid,
  created_by       uuid default auth.uid() references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  archived_at      timestamptz,
  foreign key (incident_type_id, venue_id) references public.incident_types(id, venue_id),
  foreign key (shift_id, venue_id)         references public.shifts(id, venue_id)
);
create index on public.incidents (venue_id, occurred_at desc);

create table public.maintenance_issues (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  area_id         uuid,
  title           text not null,
  details         text,
  photo_path      text,
  owner_user_id   uuid references public.profiles(id),
  priority        text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status          text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  resolved_at     timestamptz,
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  foreign key (area_id, venue_id) references public.venue_areas(id, venue_id)
);

create table public.contacts (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  organisation    text,
  category        text,             -- supplier, IT, maintenance, emergency, escalation...
  phones          text[] not null default '{}',
  email           text,
  call_tree_order int,              -- escalation order; null = not in the call tree
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz
);

create table public.approvals (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null,
  venue_id         uuid not null,
  subject_type     text not null,    -- gaming_promotion, liquor_advertising, cash_variance...
  subject_id       uuid,
  summary          text not null,
  requested_by     uuid not null default auth.uid() references public.profiles(id),
  approver_role_id uuid,
  decision         text not null default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  decided_by       uuid references public.profiles(id),
  decided_at       timestamptz,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  archived_at      timestamptz,
  check (decision = 'pending' or (decided_by is not null and decided_at is not null)),
  foreign key (approver_role_id, venue_id) references public.roles(id, venue_id)
);

select app.register_tenant_table('public.incident_types',     'settings.manage');
select app.register_tenant_table('public.incidents',          'incidents.log');
select app.register_tenant_table('public.maintenance_issues', 'maintenance.log');
select app.register_tenant_table('public.contacts',           'settings.manage');
select app.register_tenant_table('public.approvals',          null);

-- Restricted incidents (exclusions, minors, gaming) need incidents.view_restricted.
create policy restricted_incidents on public.incidents as restrictive
  for select to authenticated
  using (not restricted or app.can(venue_id, 'incidents.view_restricted'));
create policy restricted_incidents_update on public.incidents as restrictive
  for update to authenticated
  using (not restricted or app.can(venue_id, 'incidents.view_restricted'));

create or replace function app.incident_restricted_from_type() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select t.restricted into new.restricted
  from public.incident_types t where t.id = new.incident_type_id;
  return new;
end $$;

create trigger incident_restricted_from_type
  before insert on public.incidents
  for each row execute function app.incident_restricted_from_type();

-- Anyone can request an approval as themselves; only approvers decide.
create policy own_request_only on public.approvals as restrictive
  for insert to authenticated with check (requested_by = auth.uid() and decision = 'pending');
create policy approver_decides on public.approvals as restrictive
  for update to authenticated
  using (app.can(venue_id, 'compliance.sign_off'))
  with check (app.can(venue_id, 'compliance.sign_off'));

create trigger decided_approval_locked
  before update on public.approvals
  for each row when (old.decision <> 'pending')
  execute function app.reject_locked();
