-- 0007 Imports (SOP workbooks, roster CSVs) and the roster source.
-- One importer: upload -> map columns -> preview -> commit. Every upload is a batch.

create table public.import_mappings (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  kind            text not null check (kind in ('sop', 'roster', 'qualifications')),
  name            text not null,
  column_map      jsonb not null default '{}'::jsonb,   -- { target_field: source_header }
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, kind, name),
  unique (id, venue_id)
);
create unique index import_mappings_one_default on public.import_mappings (venue_id, kind)
  where is_default and archived_at is null;

create table public.import_batches (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  kind            text not null check (kind in ('sop', 'roster', 'qualifications')),
  file_path       text not null,
  file_name       text not null,
  mapping_id      uuid,
  status          text not null default 'previewed' check (status in ('previewed', 'committed', 'failed', 'discarded')),
  stats           jsonb not null default '{}'::jsonb,
  -- Roster batches cover a window (e.g. Mon-Sun); committing supersedes shifts in it.
  window_start    date,
  window_end      date,
  uploaded_by     uuid not null default auth.uid() references public.profiles(id),
  uploaded_at     timestamptz not null default now(),
  committed_by    uuid references public.profiles(id),
  committed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, venue_id),
  check (window_start is null or window_end >= window_start),
  foreign key (mapping_id, venue_id) references public.import_mappings(id, venue_id)
);
create index on public.import_batches (venue_id, kind, uploaded_at desc);

create table public.import_rows (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  batch_id        uuid not null,
  row_no          int not null,
  raw             jsonb not null,
  mapped          jsonb,
  errors          text[] not null default '{}',
  outcome         text check (outcome in ('created', 'versioned', 'updated', 'skipped', 'failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (batch_id, row_no),
  foreign key (batch_id, venue_id) references public.import_batches(id, venue_id)
);

-- Translates source values (Tanda team, shift detail, location) to venue records.
create table public.import_value_maps (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  source          text not null,       -- e.g. tanda_csv
  field           text not null check (field in ('team', 'shift_detail', 'location')),
  value           text not null,
  department_id   uuid,
  area_id         uuid,
  shift_type_id   uuid,
  is_manager      boolean not null default false,
  ignore          boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, source, field, value),
  foreign key (department_id, venue_id) references public.departments(id, venue_id),
  foreign key (area_id, venue_id)       references public.venue_areas(id, venue_id),
  foreign key (shift_type_id, venue_id) references public.shift_types(id, venue_id)
);

create table public.roster_sources (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  adapter         text not null,          -- tanda_csv (phase 1), tanda_api (phase 2)...
  config          jsonb not null default '{}'::jsonb,
  active          boolean not null default true,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (venue_id, adapter)
);

-- People as the roster system knows them, linked to app users.
create table public.external_people (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  source          text not null,
  external_id     text,                   -- Tanda Payroll ID (may be blank)
  first_name      text,
  last_name       text,
  display_name    text not null,
  external_email  text,
  user_id         uuid references public.profiles(id),
  linked_by       uuid references public.profiles(id),
  linked_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (id, venue_id),
  unique (venue_id, source, external_id)
);

create table public.roster_shifts (
  id                     uuid primary key default gen_random_uuid(),
  organisation_id        uuid not null,
  venue_id               uuid not null,
  batch_id               uuid not null,
  external_person_id     uuid not null,
  user_id                uuid references public.profiles(id),
  trading_date           date not null,
  starts_at              timestamptz not null,
  ends_at                timestamptz not null,
  team                   text,
  shift_detail           text,
  department_id          uuid,
  is_manager             boolean not null default false,
  superseded_by_batch_id uuid,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (batch_id, venue_id)               references public.import_batches(id, venue_id),
  foreign key (superseded_by_batch_id, venue_id) references public.import_batches(id, venue_id),
  foreign key (external_person_id, venue_id)     references public.external_people(id, venue_id),
  foreign key (department_id, venue_id)          references public.departments(id, venue_id)
);
create index on public.roster_shifts (venue_id, trading_date) where superseded_by_batch_id is null;

-- Import provenance links from earlier migrations.
alter table public.staff_qualifications
  add foreign key (import_batch_id, venue_id) references public.import_batches(id, venue_id);
alter table public.checklist_templates
  add foreign key (source_import_batch_id, venue_id) references public.import_batches(id, venue_id);
alter table public.processes
  add foreign key (source_import_batch_id, venue_id) references public.import_batches(id, venue_id);

select app.register_tenant_table('public.import_mappings',   'imports.run');
select app.register_tenant_table('public.import_batches',    'imports.run');
select app.register_tenant_table('public.import_rows',       'imports.run');
select app.register_tenant_table('public.import_value_maps', 'imports.run');
select app.register_tenant_table('public.roster_sources',    'settings.manage');
select app.register_tenant_table('public.external_people',   'imports.run');
select app.register_tenant_table('public.roster_shifts',     'imports.run');

-- Raw import rows can hold staff personal data: importers only.
create policy importers_only on public.import_rows as restrictive
  for select to authenticated using (app.can(venue_id, 'imports.run'));
