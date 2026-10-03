-- 0005 Processes library (SOPs), versioned, with read acknowledgements.
-- Emergency procedures are processes flagged is_emergency.

create table public.processes (
  id                     uuid primary key default gen_random_uuid(),
  organisation_id        uuid not null,
  venue_id               uuid not null,
  title                  text not null,
  category               text,
  department_id          uuid,
  status                 text not null default 'draft' check (status in ('draft', 'live', 'archived')),
  is_emergency           boolean not null default false,
  pinned                 boolean not null default false,
  source_key             text,
  source_import_batch_id uuid,     -- FK added with import_batches
  current_version_id     uuid,     -- FK added below (circular)
  created_by             uuid default auth.uid() references public.profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  archived_at            timestamptz,
  unique (id, venue_id),
  unique (venue_id, source_key),
  foreign key (department_id, venue_id) references public.departments(id, venue_id)
);

-- steps: [{ text, media: [storage paths], video_url? }]
create table public.process_versions (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  process_id      uuid not null,
  version         int not null check (version > 0),
  steps           jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  search          tsvector,
  published_at    timestamptz,
  published_by    uuid references public.profiles(id),
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (process_id, version),
  unique (id, venue_id),
  foreign key (process_id, venue_id) references public.processes(id, venue_id)
);
create index on public.process_versions using gin (search);

alter table public.processes
  add foreign key (current_version_id, venue_id) references public.process_versions(id, venue_id);

create table public.process_acknowledgements (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null,
  venue_id           uuid not null,
  process_version_id uuid not null,
  user_id            uuid not null default auth.uid() references public.profiles(id),
  acknowledged_at    timestamptz not null default now(),
  unique (process_version_id, user_id),
  foreign key (process_version_id, venue_id) references public.process_versions(id, venue_id)
);

select app.register_tenant_table('public.processes',                'templates.manage');
select app.register_tenant_table('public.process_versions',         'templates.manage');
select app.register_tenant_table('public.process_acknowledgements', null);

create policy own_acknowledgement_only on public.process_acknowledgements as restrictive
  for insert to authenticated with check (user_id = auth.uid());
revoke update on public.process_acknowledgements from authenticated;

create trigger published_version_locked
  before update on public.process_versions
  for each row when (old.published_at is not null)
  execute function app.reject_locked();
