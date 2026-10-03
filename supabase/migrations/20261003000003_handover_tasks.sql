-- 0003 Handover log and tasks.

create table public.handovers (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null,
  venue_id            uuid not null,
  shift_id            uuid,
  outgoing_user_id    uuid not null references public.profiles(id),
  incoming_user_id    uuid references public.profiles(id),
  open_issues         text,
  cash_flags          text,
  stock_flags         text,
  guests_to_watch     text,
  notes               text,
  outgoing_signed_at  timestamptz,
  incoming_signed_at  timestamptz,
  created_by          uuid default auth.uid() references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  archived_at         timestamptz,
  unique (id, venue_id),
  foreign key (shift_id, venue_id) references public.shifts(id, venue_id)
);
create index on public.handovers (venue_id, created_at desc);

create table public.tasks (
  id                   uuid primary key default gen_random_uuid(),
  organisation_id      uuid not null,
  venue_id             uuid not null,
  title                text not null,
  description          text,
  owner_user_id        uuid references public.profiles(id),
  department_id        uuid,
  due_at               timestamptz,
  priority             text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status               text not null default 'open' check (status in ('open', 'in_progress', 'done', 'cancelled')),
  recurrence           text,     -- RRULE
  recurrence_parent_id uuid,
  proof_required       boolean not null default false,
  proof_path           text,
  completed_by         uuid references public.profiles(id),
  completed_at         timestamptz,
  created_by           uuid default auth.uid() references public.profiles(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  archived_at          timestamptz,
  unique (id, venue_id),
  foreign key (department_id, venue_id)        references public.departments(id, venue_id),
  foreign key (recurrence_parent_id, venue_id) references public.tasks(id, venue_id)
);
create index on public.tasks (venue_id, status, due_at);
create index on public.tasks (owner_user_id) where status in ('open', 'in_progress');
-- One generated instance per recurrence slot.
create unique index tasks_recurrence_slot on public.tasks (recurrence_parent_id, due_at)
  where recurrence_parent_id is not null;

create table public.task_comments (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  task_id         uuid not null,
  body            text,
  photo_path      text,
  created_by      uuid not null default auth.uid() references public.profiles(id),
  created_at      timestamptz not null default now(),
  foreign key (task_id, venue_id) references public.tasks(id, venue_id)
);

create table public.handover_tasks (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  venue_id        uuid not null,
  handover_id     uuid not null,
  task_id         uuid not null,
  created_at      timestamptz not null default now(),
  unique (handover_id, task_id),
  foreign key (handover_id, venue_id) references public.handovers(id, venue_id),
  foreign key (task_id, venue_id)     references public.tasks(id, venue_id)
);

select app.register_tenant_table('public.handovers',      'handover.write');
select app.register_tenant_table('public.tasks',          'tasks.manage');
select app.register_tenant_table('public.task_comments',  null);
select app.register_tenant_table('public.handover_tasks', 'handover.write');

-- Comments are attributed to the author.
create policy own_comment_only on public.task_comments as restrictive
  for insert to authenticated with check (created_by = auth.uid());
revoke update on public.task_comments from authenticated;

-- Task owners can progress their own tasks without tasks.manage...
create policy owner_update on public.tasks for update to authenticated
  using (owner_user_id = auth.uid() and venue_id in (select app.member_venue_ids()))
  with check (owner_user_id = auth.uid() and venue_id in (select app.member_venue_ids()));

-- ...but only the progress fields.
create or replace function app.tasks_owner_field_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if app.can(new.venue_id, 'tasks.manage') or auth.uid() is null then
    return new;
  end if;
  if (to_jsonb(new) - array['status', 'proof_path', 'completed_by', 'completed_at', 'updated_at'])
     is distinct from
     (to_jsonb(old) - array['status', 'proof_path', 'completed_by', 'completed_at', 'updated_at']) then
    raise exception 'only status and proof can be changed on an assigned task' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger tasks_owner_field_guard
  before update on public.tasks
  for each row execute function app.tasks_owner_field_guard();

-- Each manager signs only their own side of the handover.
create or replace function app.guard_handover_signatures() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.outgoing_signed_at is distinct from (case when tg_op = 'UPDATE' then old.outgoing_signed_at end)
     and new.outgoing_user_id is distinct from auth.uid() then
    raise exception 'only the outgoing manager can sign as outgoing' using errcode = '42501';
  end if;
  if new.incoming_signed_at is distinct from (case when tg_op = 'UPDATE' then old.incoming_signed_at end)
     and new.incoming_user_id is distinct from auth.uid() then
    raise exception 'only the incoming manager can sign as incoming' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.outgoing_signed_at is not null
     and new.outgoing_user_id is distinct from old.outgoing_user_id then
    raise exception 'signed handover parties cannot change' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.incoming_signed_at is not null
     and new.incoming_user_id is distinct from old.incoming_user_id then
    raise exception 'signed handover parties cannot change' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger guard_handover_signatures
  before insert or update on public.handovers
  for each row execute function app.guard_handover_signatures();

-- Handover is locked once both managers have signed.
create trigger signed_handover_locked
  before update on public.handovers
  for each row when (old.outgoing_signed_at is not null and old.incoming_signed_at is not null)
  execute function app.reject_locked();
