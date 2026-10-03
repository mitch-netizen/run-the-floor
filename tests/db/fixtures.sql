-- Test fixtures: two organisations, three venues, one row in every tenant table
-- per venue. Loaded by tests/db/setup.ts inside a transaction as the DB owner.
--
--   org1: venue A1, venue A2      org2: venue B
--   users: admin_a1, staff_a1, suspended_a1, admin_a2, owner_org1, admin_b

create schema if not exists test;

create or replace function test.seed_venue(p_venue uuid, p_admin uuid) returns void
language plpgsql as $$
declare
  role_id  uuid; dept uuid; area uuid; qtype uuid; stype uuid; shift uuid;
  tmpl uuid; ver uuid; run uuid; handover uuid; task uuid;
  rtmpl uuid; rver uuid; ev uuid; rs uuid; proc uuid; pver uuid; itype uuid;
  mapping uuid; batch uuid; person uuid;
begin
  select r.id into role_id from public.roles r where r.venue_id = p_venue and r.name = 'Admin';

  insert into public.departments (venue_id, name) values (p_venue, 'Bar') returning id into dept;
  insert into public.venue_areas (venue_id, name, department_id) values (p_venue, 'Main Bar', dept) returning id into area;
  insert into public.venue_settings (venue_id, timezone, jurisdiction, nominated_approver_role_id)
    values (p_venue, 'Australia/Brisbane', 'AU-QLD', role_id);
  insert into public.qualification_types (venue_id, name) values (p_venue, 'Approved Manager') returning id into qtype;
  insert into public.staff_qualifications (venue_id, user_id, qualification_type_id, expires_on)
    values (p_venue, p_admin, qtype, current_date + 365);
  insert into public.compliance_rules (venue_id, jurisdiction, rule_key, params)
    values (p_venue, 'AU-QLD', 'closer_requires_qualification', jsonb_build_object('qualification_type_ids', jsonb_build_array(qtype)));

  insert into public.shift_types (venue_id, name, kind, is_venue_close) values (p_venue, 'Close', 'close', true) returning id into stype;
  insert into public.shifts (venue_id, trading_date, shift_type_id) values (p_venue, current_date, stype) returning id into shift;
  insert into public.shift_managers (venue_id, shift_id, user_id, is_closer) values (p_venue, shift, p_admin, true);
  insert into public.checklist_templates (venue_id, name, area_id, shift_type_id) values (p_venue, 'Close', area, stype) returning id into tmpl;
  insert into public.checklist_template_versions (venue_id, template_id, version, items, published_at)
    values (p_venue, tmpl, 1, '[{"key":"fridge","label":"Fridge temp","type":"number","min":0,"max":5,"required":true}]', now())
    returning id into ver;
  insert into public.checklist_runs (venue_id, template_version_id, shift_id, area_id, trading_date)
    values (p_venue, ver, shift, area, current_date) returning id into run;
  insert into public.run_items (venue_id, run_id, item_key, value) values (p_venue, run, 'fridge', '3');
  insert into public.exceptions (venue_id, source_type, source_id, description) values (p_venue, 'checklist_run', run, 'Fixture');

  insert into public.handovers (venue_id, shift_id, outgoing_user_id) values (p_venue, shift, p_admin) returning id into handover;
  insert into public.tasks (venue_id, title, owner_user_id, department_id) values (p_venue, 'Fixture task', p_admin, dept) returning id into task;
  insert into public.task_comments (venue_id, task_id, body, created_by) values (p_venue, task, 'Fixture', p_admin);
  insert into public.handover_tasks (venue_id, handover_id, task_id) values (p_venue, handover, task);

  insert into public.runsheet_templates (venue_id, name, kind) values (p_venue, 'Function', 'function') returning id into rtmpl;
  insert into public.runsheet_template_versions (venue_id, template_id, version) values (p_venue, rtmpl, 1) returning id into rver;
  insert into public.events (venue_id, title, event_date) values (p_venue, 'Fixture function', current_date) returning id into ev;
  insert into public.runsheets (venue_id, kind, event_id, template_version_id) values (p_venue, 'function', ev, rver) returning id into rs;
  insert into public.runsheet_entries (venue_id, runsheet_id, title) values (p_venue, rs, 'Doors open');

  insert into public.processes (venue_id, title) values (p_venue, 'Cash up') returning id into proc;
  insert into public.process_versions (venue_id, process_id, version) values (p_venue, proc, 1) returning id into pver;
  update public.processes set current_version_id = pver where id = proc;
  insert into public.process_acknowledgements (venue_id, process_version_id, user_id) values (p_venue, pver, p_admin);

  insert into public.incident_types (venue_id, name) values (p_venue, 'Refusal of service') returning id into itype;
  insert into public.incidents (venue_id, incident_type_id, occurred_at, description) values (p_venue, itype, now(), 'Fixture');
  insert into public.maintenance_issues (venue_id, title, area_id) values (p_venue, 'Leaking tap', area);
  insert into public.contacts (venue_id, name, category) values (p_venue, 'Electrician', 'maintenance');
  insert into public.approvals (venue_id, subject_type, summary, requested_by) values (p_venue, 'gaming_promotion', 'Fixture', p_admin);

  insert into public.import_mappings (venue_id, kind, name) values (p_venue, 'roster', 'Default') returning id into mapping;
  insert into public.import_batches (venue_id, kind, file_path, file_name, mapping_id, uploaded_by)
    values (p_venue, 'roster', p_venue || '/roster.csv', 'roster.csv', mapping, p_admin) returning id into batch;
  insert into public.import_rows (venue_id, batch_id, row_no, raw) values (p_venue, batch, 1, '{}');
  insert into public.import_value_maps (venue_id, source, field, value, department_id) values (p_venue, 'tanda_csv', 'team', 'Bar', dept);
  insert into public.roster_sources (venue_id, adapter) values (p_venue, 'tanda_csv');
  insert into public.external_people (venue_id, source, external_id, display_name) values (p_venue, 'tanda_csv', '1', 'Fixture Person') returning id into person;
  insert into public.roster_shifts (venue_id, batch_id, external_person_id, trading_date, starts_at, ends_at)
    values (p_venue, batch, person, current_date, now(), now() + interval '8 hours');
end $$;

create or replace function test.load_fixtures() returns void
language plpgsql as $$
declare
  all_caps text[] := (select array_agg(key) from public.capabilities);
begin
  insert into auth.users (id, email) values
    ('00000000-0000-0000-0000-0000000000a1', 'admin_a1@test'),
    ('00000000-0000-0000-0000-0000000000a2', 'staff_a1@test'),
    ('00000000-0000-0000-0000-0000000000a3', 'suspended_a1@test'),
    ('00000000-0000-0000-0000-0000000000a4', 'admin_a2@test'),
    ('00000000-0000-0000-0000-0000000000a5', 'owner_org1@test'),
    ('00000000-0000-0000-0000-0000000000b1', 'admin_b@test');

  insert into public.organisations (id, name, slug) values
    ('10000000-0000-0000-0000-000000000001', 'Org One', 'org-one'),
    ('10000000-0000-0000-0000-000000000002', 'Org Two', 'org-two');
  insert into public.venues (id, organisation_id, name, slug) values
    ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-000000000001', 'Venue A1', 'venue-a1'),
    ('20000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-000000000001', 'Venue A2', 'venue-a2'),
    ('20000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-000000000002', 'Venue B',  'venue-b');

  insert into public.roles (venue_id, name, capabilities)
  select v.id, r.name, r.caps
  from public.venues v
  cross join (values ('Admin', all_caps), ('Staff', array['checklist.run'])) as r(name, caps)
  where v.organisation_id in ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002');

  insert into public.memberships (venue_id, user_id, role_id, status)
  select m.venue_id, m.user_id, r.id, m.status
  from (values
    ('20000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000a1'::uuid, 'Admin', 'active'),
    ('20000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000a2'::uuid, 'Staff', 'active'),
    ('20000000-0000-0000-0000-0000000000a1'::uuid, '00000000-0000-0000-0000-0000000000a3'::uuid, 'Admin', 'suspended'),
    ('20000000-0000-0000-0000-0000000000a2'::uuid, '00000000-0000-0000-0000-0000000000a4'::uuid, 'Admin', 'active'),
    ('20000000-0000-0000-0000-0000000000b1'::uuid, '00000000-0000-0000-0000-0000000000b1'::uuid, 'Admin', 'active')
  ) as m(venue_id, user_id, role_name, status)
  join public.roles r on r.venue_id = m.venue_id and r.name = m.role_name;

  insert into public.org_memberships (organisation_id, user_id, is_group_owner) values
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a5', true);

  perform test.seed_venue('20000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1');
  perform test.seed_venue('20000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a4');
  perform test.seed_venue('20000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1');

  insert into storage.objects (bucket_id, name) values
    ('evidence', '20000000-0000-0000-0000-0000000000a1/run/photo.jpg'),
    ('evidence', '20000000-0000-0000-0000-0000000000b1/run/photo.jpg'),
    ('imports',  '20000000-0000-0000-0000-0000000000a1/roster.csv');
end $$;
