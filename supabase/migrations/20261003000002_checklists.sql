-- 0002 Shifts, checklist templates (versioned) and checklist runs.
-- Templates and instances are separate: runs point at an immutable published version.

create table public.shift_types (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  kind            text not null check (kind in ('open', 'mid', 'close', 'other')),
  is_venue_close  boolean not null default false,
  default_start   time,
  default_end     time,
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, name),
  unique (id, venue_id)
);

create table public.shifts (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  trading_date    date not null,
  shift_type_id   uuid not null,
  status          text not null default 'planned' check (status in ('planned', 'open', 'closed')),
  notes           text,
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (id, venue_id),
  foreign key (shift_type_id, venue_id) references public.shift_types(id, venue_id)
);
create index on public.shifts (venue_id, trading_date);

create table public.shift_managers (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  shift_id        uuid not null,
  user_id         uuid not null references public.profiles(id),
  is_closer       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (shift_id, user_id),
  foreign key (shift_id, venue_id) references public.shifts(id, venue_id)
);

create table public.checklist_templates (
  id                     uuid primary key default gen_random_uuid(),
  organisation_id        uuid not null,
  venue_id               uuid not null,
  name                   text not null,
  area_id                uuid,
  shift_type_id          uuid,
  department_id          uuid,
  status                 text not null default 'draft' check (status in ('draft', 'live', 'archived')),
  source_key             text,     -- stable key from an SOP import, used to version re-uploads
  source_import_batch_id uuid,     -- FK added with import_batches
  created_by             uuid default auth.uid() references public.profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  archived_at            timestamptz,
  unique (id, venue_id),
  unique (venue_id, source_key),
  foreign key (area_id, venue_id)       references public.venue_areas(id, venue_id),
  foreign key (shift_type_id, venue_id) references public.shift_types(id, venue_id),
  foreign key (department_id, venue_id) references public.departments(id, venue_id)
);

-- items: array of typed items, validated in the app (src/lib/checklist/items.ts):
--   { key, label, type: tick|number|text|photo|signature|dropdown, required,
--     min?, max?, unit?, options?, exception_on?, process_id?, severity? }
create table public.checklist_template_versions (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  template_id     uuid not null,
  version         int not null check (version > 0),
  items           jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  due_offset      interval,      -- due time relative to shift start
  published_at    timestamptz,
  published_by    uuid references public.profiles(id),
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (template_id, version),
  unique (id, venue_id),
  foreign key (template_id, venue_id) references public.checklist_templates(id, venue_id)
);

create table public.checklist_runs (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null,
  venue_id            uuid not null,
  template_version_id uuid not null,
  shift_id            uuid,
  area_id             uuid,
  trading_date        date not null,
  assigned_to         uuid references public.profiles(id),
  status              text not null default 'open' check (status in ('open', 'completed', 'missed')),
  due_at              timestamptz,
  started_by          uuid default auth.uid() references public.profiles(id),
  started_at          timestamptz not null default now(),
  completed_by        uuid references public.profiles(id),
  completed_at        timestamptz,
  late                boolean not null default false,
  exception_count     int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  archived_at         timestamptz,
  unique (id, venue_id),
  foreign key (template_version_id, venue_id) references public.checklist_template_versions(id, venue_id),
  foreign key (shift_id, venue_id)            references public.shifts(id, venue_id),
  foreign key (area_id, venue_id)             references public.venue_areas(id, venue_id)
);
create index on public.checklist_runs (venue_id, trading_date);

create table public.run_items (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  run_id          uuid not null,
  item_key        text not null,
  value           jsonb,
  photo_path      text,
  out_of_range    boolean not null default false,
  answered_by     uuid default auth.uid() references public.profiles(id),
  answered_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (run_id, item_key),
  foreign key (run_id, venue_id) references public.checklist_runs(id, venue_id)
);

create table public.exceptions (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  source_type     text not null,           -- e.g. checklist_run
  source_id       uuid not null,
  item_key        text,
  severity        text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  description     text not null,
  status          text not null default 'open' check (status in ('open', 'resolved')),
  resolution_note text,
  resolved_by     uuid references public.profiles(id),
  resolved_at     timestamptz,
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (status = 'open' or (resolution_note is not null and resolved_at is not null))
);
create index on public.exceptions (venue_id, status);

select app.register_tenant_table('public.shift_types',                 'settings.manage');
select app.register_tenant_table('public.shifts',                      'shifts.manage');
select app.register_tenant_table('public.shift_managers',              'shifts.manage');
select app.register_tenant_table('public.checklist_templates',         'templates.manage');
select app.register_tenant_table('public.checklist_template_versions', 'templates.manage');
select app.register_tenant_table('public.checklist_runs',              'checklist.run');
select app.register_tenant_table('public.run_items',                   'checklist.run');
select app.register_tenant_table('public.exceptions',                  'checklist.run');

-- Published template versions never change; edits create a new version.
create trigger published_version_locked
  before update on public.checklist_template_versions
  for each row when (old.published_at is not null)
  execute function app.reject_locked();

-- Completed (or missed) runs are an audit record.
create trigger completed_run_locked
  before update on public.checklist_runs
  for each row when (old.status <> 'open')
  execute function app.reject_locked();

create or replace function app.reject_items_on_locked_run() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.checklist_runs r where r.id = new.run_id and r.status <> 'open') then
    raise exception 'checklist run is locked' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger run_items_locked_run
  before insert or update on public.run_items
  for each row execute function app.reject_items_on_locked_run();

-- Resolved exceptions are final.
create trigger resolved_exception_locked
  before update on public.exceptions
  for each row when (old.status = 'resolved')
  execute function app.reject_locked();
