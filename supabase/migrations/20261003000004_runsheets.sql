-- 0004 Functions (events) and run sheets.
-- Deposit amounts are recorded exactly as invoiced; the app never calculates revenue.

create table public.runsheet_templates (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  name            text not null,
  kind            text not null check (kind in ('function', 'shift')),
  status          text not null default 'draft' check (status in ('draft', 'live', 'archived')),
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (id, venue_id)
);

-- sections: [{ key, label, fields: [{ key, label, type }] }]
create table public.runsheet_template_versions (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  template_id     uuid not null,
  version         int not null check (version > 0),
  sections        jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  published_at    timestamptz,
  published_by    uuid references public.profiles(id),
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (template_id, version),
  unique (id, venue_id),
  foreign key (template_id, venue_id) references public.runsheet_templates(id, venue_id)
);

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  title           text not null,
  client_name     text,
  contact         jsonb not null default '{}'::jsonb,   -- { name, phone, email }
  event_date      date not null,
  starts_at       timestamptz,
  ends_at         timestamptz,
  room            text,
  guest_numbers   int check (guest_numbers >= 0),
  status          text not null default 'tentative' check (status in ('tentative', 'confirmed', 'completed', 'cancelled')),
  deposit_amount  numeric(12, 2),
  deposit_status  text check (deposit_status in ('not_required', 'requested', 'paid', 'refunded')),
  source          text not null default 'manual',      -- 'manual' or an events-source adapter key
  external_ref    text,
  created_by      uuid default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  unique (id, venue_id),
  unique (venue_id, source, external_ref)
);
create index on public.events (venue_id, event_date);

create table public.runsheets (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null,
  venue_id            uuid not null,
  kind                text not null check (kind in ('function', 'shift')),
  shift_id            uuid,
  event_id            uuid,
  template_version_id uuid,
  data                jsonb not null default '{}'::jsonb,
  status              text not null default 'draft' check (status in ('draft', 'final', 'completed')),
  post_event_notes    text,
  created_by          uuid default auth.uid() references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  archived_at         timestamptz,
  unique (id, venue_id),
  check ((kind = 'function' and event_id is not null) or (kind = 'shift' and shift_id is not null)),
  foreign key (shift_id, venue_id)            references public.shifts(id, venue_id),
  foreign key (event_id, venue_id)            references public.events(id, venue_id),
  foreign key (template_version_id, venue_id) references public.runsheet_template_versions(id, venue_id)
);

create table public.runsheet_entries (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  runsheet_id     uuid not null,
  at_time         timestamptz,
  title           text not null,
  details         text,
  owner_user_id   uuid references public.profiles(id),
  sort            int not null default 0,
  done_at         timestamptz,
  done_by         uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  foreign key (runsheet_id, venue_id) references public.runsheets(id, venue_id)
);

select app.register_tenant_table('public.runsheet_templates',         'templates.manage');
select app.register_tenant_table('public.runsheet_template_versions', 'templates.manage');
select app.register_tenant_table('public.events',                     'functions.manage');
select app.register_tenant_table('public.runsheets',                  'functions.manage');
select app.register_tenant_table('public.runsheet_entries',           'functions.manage');

create trigger published_version_locked
  before update on public.runsheet_template_versions
  for each row when (old.published_at is not null)
  execute function app.reject_locked();
