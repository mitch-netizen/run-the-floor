-- Generic demo venue so the app can be tried before a real venue's SOPs are loaded.
-- Idempotent: does nothing if the demo venue already exists.
-- Grant yourself access after signing in once:
--   select app.grant_membership('you@example.com', 'demo', 'Admin');

do $$
declare
  v uuid;
  am uuid;
begin
  if exists (select 1 from public.venues where slug = 'demo') then
    return;
  end if;

  v := app.provision_venue('demo-group', 'Demo Hospitality Group', 'demo', 'Demo Hotel',
                           'Australia/Brisbane', 'AU-QLD', 'Demo Hospitality Pty Ltd');

  insert into public.departments (venue_id, name, sort) values
    (v, 'Bar', 1), (v, 'Gaming', 2), (v, 'Kitchen', 3), (v, 'Restaurant', 4),
    (v, 'Accommodation', 5), (v, 'Retail', 6);

  insert into public.venue_areas (venue_id, name, area_type, department_id, sort)
  select v, a.name, a.area_type, d.id, a.sort
  from (values
    ('Main Bar', 'bar', 'Bar', 1), ('Sports Bar', 'bar', 'Bar', 2), ('Gaming Room', 'gaming', 'Gaming', 3),
    ('Kitchen', 'kitchen', 'Kitchen', 4), ('Restaurant', 'restaurant', 'Restaurant', 5),
    ('Accommodation', 'accommodation', 'Accommodation', 6), ('Bottle Shop', 'retail', 'Retail', 7)
  ) as a(name, area_type, dept, sort)
  join public.departments d on d.venue_id = v and d.name = a.dept;

  insert into public.shift_types (venue_id, name, kind, is_venue_close, default_start, default_end, sort) values
    (v, 'Open',  'open',  false, '09:00', '17:00', 1),
    (v, 'Mid',   'mid',   false, '12:00', '20:00', 2),
    (v, 'Close', 'close', true,  '17:00', '02:00', 3);

  insert into public.qualification_types (venue_id, name) values
    (v, 'Approved Manager'), (v, 'RSA'), (v, 'RCG');
  select id into am from public.qualification_types where venue_id = v and name = 'Approved Manager';

  insert into public.compliance_rules (venue_id, jurisdiction, rule_key, params, notes) values
    (v, 'AU-QLD', 'closer_requires_qualification', jsonb_build_object('qualification_type_ids', jsonb_build_array(am)),
     'The venue close-out can only be assigned to a manager with a current approved manager licence.'),
    (v, 'AU-QLD', 'cash_variance_threshold', '{"amount": 20}',
     'A cash count variance above this amount raises an exception for the nominated approver.');

  insert into public.incident_types (venue_id, name, restricted, sort) values
    (v, 'Refusal of service', false, 1),
    (v, 'Intoxicated patron', false, 2),
    (v, 'Minor on premises', true, 3),
    (v, 'Gaming incident', true, 4),
    (v, 'Self-exclusion breach', true, 5),
    (v, 'Injury', false, 6),
    (v, 'Property damage', false, 7);

  insert into public.contacts (venue_id, name, organisation, category, phones, call_tree_order, notes) values
    (v, 'Emergency services', null, 'emergency', '{000}', 1, 'Police, fire, ambulance'),
    (v, 'Venue Manager (example)', 'Demo Hotel', 'escalation', '{0400 000 000}', 2, 'Replace with the real escalation order'),
    (v, 'Electrician (example)', 'Example Electrical', 'maintenance', '{07 0000 0000}', null, null),
    (v, 'IT support (example)', 'Example IT', 'it', '{1300 000 000}', null, null);
end $$;
