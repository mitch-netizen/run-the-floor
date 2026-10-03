# Run The Floor: Phase 1 build plan and schema

## Context

Run The Floor (RTF) is a multi-tenant PWA that gives duty managers a "second set of eyes": checklists, run sheets, tasks, processes and handover. It replaces the paper, memory and messages that make shifts inconsistent today. The Queens Hotel Gladstone is tenant one and the pilot, and the product will be sold to other venues. That means nothing venue-specific goes in code.

The repo (`mitch-netizen/run-the-floor`, branch `ccr-c0e4f5ca-be0swe`) is empty, so this is greenfield.

**What exists today (checked live):**
- **Supabase:** the org "Functions Manager" has one project, "The Queens" (ap-southeast-2, PG17). It already runs two live apps:
  - Functions Manager (enquiries, events with run-sheet fields, tasks).
  - rev-dashboard (`rev_daily_actuals`, targets).
  - It already has its own `venues`, `organisations` (these are client companies), `tasks`, `events`, `audit_log` and `venue_users` tables.
- **Vercel:** the team "The Queens Gladstone" has two projects, `functions-manager` and `rev-dashboard`.

**Decisions you made:**
1. RTF gets a **new dedicated Supabase project** (`run-the-floor`, ap-southeast-2). It does not touch the live Queens project.
2. **Function run sheets are built natively.** A read-only Functions Manager "events source" adapter comes in phase 2, so The Queens never types a function in twice. rev-dashboard becomes the natural source for the phase 2 KPI snapshot through the same adapter pattern.
3. **The Tanda roster sample has been received and analysed.** See the "Tanda sample" section below.

---

## Stack (pinned)

- **App:** Next.js 16 (App Router, Server Actions), TypeScript strict, Tailwind v4, `@supabase/ssr`, zod.
- **UI:** a small hand-rolled set of components with big touch targets. No component framework beyond Radix primitives where needed (dialog, select).
- **Spreadsheets:** SheetJS CE from the official `cdn.sheetjs.com` tarball. The npm `xlsx@0.18.5` package is stale and has known CVEs. It parses on the server in a route handler.
- **PWA:** a hand-written `manifest.webmanifest` and a minimal service worker that caches the app shell only. The offline queue is phase 2.
- **Tests:**
  - Vitest for units.
  - DB tests use Vitest and `pg`. They impersonate users with `set local role authenticated` plus `request.jwt.claims`.
  - Playwright smoke tests on the preinstalled Chromium.
- **Database tests run in two places:**
  - **Locally (here):** a throwaway Postgres 16 cluster with a small `auth` shim (`auth.uid()`, `auth.users`).
  - **In CI (GitHub Actions):** `supabase start` against the real local stack.

---

## Tenancy and security model

**Every tenant table carries `organisation_id` and `venue_id`.** Both are NOT NULL, foreign-keyed, and indexed together as `(venue_id, …)`.

**RLS helper functions** live in schema `app`. They are `security definer`, `stable` and use `set search_path = ''`:
- `app.venue_ids()` returns the set of venues the current user has an active membership in, plus every venue in organisations where the user is a group owner.
- `app.can(venue_id, capability text)` returns a boolean: the user's role at that venue grants that capability.
- `app.has_qualification(user_id, venue_id, qual_type_id, on_date)` returns a boolean.

**Standard policy per table:**
- `select using (venue_id in (select app.venue_ids()))`.
- Writes use `with check` on the same condition, plus `app.can(...)` where a capability applies.
- There are **no DELETE grants** to `authenticated` on any table. Archiving is `archived_at` / `archived_by`.

**Capabilities vs roles:**
- **Capabilities are a fixed catalogue in code.** They describe what the software can do, for example `templates.manage`, `checklist.run`, `checklist.close_out`, `venue.close`, `compliance.sign_off`, `incidents.view_restricted`, `users.manage`, `imports.run`, `tasks.assign`, `reports.view`.
- **Roles are venue data:** `roles(venue_id, name, capabilities text[])`.
- The Queens' seven roles are seeded as data. A new venue gets them as an editable starter set.

**Audit:**
- One generic trigger, `app.audit()`, is attached to every tenant table. It writes `audit_log(actor, action, table, record_id, before, after, at)`.
- `audit_log` is insert-only. No update or delete policy exists, and it is revoked even from the owner role used by the app.

**Immutability:**
- Triggers block updates to completed checklist runs and their items.
- Triggers block updates to published template versions.
- Corrections are made by a new run or an "override" row, which is itself audited.

**Remote sign-out** works in three layers:
1. Deactivating a membership takes effect at once, because every policy goes through `app.venue_ids()`.
2. An admin action also calls `auth.admin.signOut(userId, 'global')`.
3. Device data stays minimal, because there is no offline cache of records in phase 1.

**Storage:**
- There are private buckets for `evidence`, `sop-media`, `attachments` and `imports`.
- Object paths are prefixed `{venue_id}/…`.
- Storage policies check `(storage.foldername(name))[1]::uuid in (select app.venue_ids())`.

---

## Schema (migration groups)

The SQL lives in `supabase/migrations/`, with one migration per group. Common columns are `id uuid pk default gen_random_uuid()`, `organisation_id`, `venue_id`, `created_at`, `created_by`, `updated_at` and `archived_at`.

**0001 tenancy**
| table | key fields |
|---|---|
| organisations | name, slug |
| venues | organisation_id, name, slug, licensee_entity_name, licence_number, address, branding jsonb |
| venue_settings | venue_id pk, timezone, jurisdiction (e.g. `AU-QLD`), trading_hours jsonb, trading_day_cutover time (a 2am close belongs to the prior trading day), enabled_modules text[], nominated_approver_role_id |
| profiles | id = auth.users.id, full_name, email, phone |
| org_memberships | user_id, organisation_id, is_group_owner (cross-venue read) |
| roles | venue_id, name, capabilities text[], sort |
| memberships | user_id, venue_id, role_id, department_id, status (active/suspended), pin_hash |
| departments, venue_areas | name, owner_user_id, area_type |
| qualification_types | venue_id, name (Approved Manager, RSA, RCG), warn_days int[] default {60,30} |
| staff_qualifications | user_id, qualification_type_id, number, expires_on, source (manual/import), import_batch_id |
| compliance_rules | venue_id, jurisdiction, rule_key, params jsonb, active. Example: `closer_requires_qualification {qualification_type_ids:[…]}`, `cash_variance_threshold {amount}`, `approval_gate {subject:'gaming_promotion'}` |
| audit_log | as above |

**0002 checklists**
| table | key fields |
|---|---|
| shift_types | venue_id, name, kind (open/mid/close/other), is_venue_close bool, default_start, default_end |
| shifts | trading_date, shift_type_id, status, notes |
| shift_managers | shift_id, user_id, is_closer. A trigger enforces the `closer_requires_qualification` rule. |
| checklist_templates | name, area_id, shift_type_id, department_id, status (draft/live/archived), source_import_batch_id |
| checklist_template_versions | template_id, version, items jsonb (zod-validated typed items: `tick`, `number{min,max,unit}`, `text`, `photo`, `signature`, `dropdown{options}`; each has `key`, `label`, `required`, `process_id?`, `exception_severity`), due_offset, published_at. Immutable once published. |
| checklist_runs | template_version_id, shift_id, area_id, assigned_to, started_by/at, completed_by/at, status (open/completed/missed), due_at, late bool, exception_count |
| run_items | run_id, item_key, value jsonb, photo_path, answered_by/at, out_of_range bool |
| exceptions | source_type/id, item_key, severity, description, status, resolved_by/at, resolution_note |

**Close-out** goes through the RPC `complete_checklist_run(run_id)`. It:
- checks that every required item is answered;
- checks that the closer qualification is valid on the trading date (for close templates);
- requires a resolution note on each exception;
- then locks the run.

Out-of-range values raise an exception through a trigger on `run_items`, so the rule is enforced server-side and not only in the UI.

**0003 handover and tasks**
| table | key fields |
|---|---|
| handovers | shift_id, outgoing_user_id, incoming_user_id, open_issues, cash_flags, stock_flags, guests_to_watch, notes, outgoing_signed_at, incoming_signed_at (locked when both are signed) |
| tasks | title, description, owner_user_id, department_id, due_at, priority, status, recurrence (RRULE text), recurrence_parent_id, proof_required, proof_path, completed_by/at |
| task_comments | task_id, body, photo_path |
| handover_tasks | handover_id, task_id (carried-over tasks) |

Recurrence in phase 1 works like this: completing or expiring a recurring task creates the next instance (one row, idempotent on `(recurrence_parent_id, due_at)`). Scheduled bulk generation is phase 2 cron.

**0004 run sheets and functions**
| table | key fields |
|---|---|
| runsheet_templates (+ _versions) | kind (function/shift), sections jsonb (event details, timings, room set, menu & platters, AV, staffing, deposits, contact, post-event notes) |
| events | client_name, contact jsonb, date, room, start/end, guest_numbers, status, deposit_amount, deposit_status, source (manual / adapter key), external_ref |
| runsheets | kind, shift_id or event_id, template_version_id, data jsonb, status |
| runsheet_entries | runsheet_id, at time, title, owner_user_id, done_at |

Deposits are entered exactly as invoiced, never calculated.

**0005 processes**
| table | key fields |
|---|---|
| processes | title, category, department_id, source_key (for import versioning), status, current_version_id, is_emergency bool, pinned |
| process_versions | process_id, version, steps jsonb (text, media paths, video url), published_at, published_by |
| process_acknowledgements | process_version_id, user_id, acknowledged_at |

Emergency procedures are processes with `is_emergency`, shown on a one-tap screen together with the call tree.

**0006 incidents, maintenance, contacts, approvals**
| table | key fields |
|---|---|
| incident_types | venue_id, name, restricted bool, required_fields jsonb |
| incidents | type_id, occurred_at, people jsonb, description, action_taken, follow_up, severity, status, restricted. Restricted rows need `incidents.view_restricted` in RLS. |
| maintenance_issues | area_id, title, photo_path, owner_user_id, status, priority |
| contacts | name, organisation, category, phones, email, call_tree_order, notes |
| approvals | subject_type, subject_id, requested_by, approver_role_id, decision, decided_by/at, note |

**0007 imports and roster**
| table | key fields |
|---|---|
| import_mappings | venue_id, kind (`sop`, `roster`, `qualifications`), name, column_map jsonb, is_default |
| import_batches | kind, file_path, uploaded_by, status (previewed/committed/failed), stats jsonb, mapping_id, version |
| import_rows | batch_id, row_no, raw jsonb, mapped jsonb, errors text[], outcome |
| roster_sources | venue_id, adapter (`tanda_csv`), config jsonb, last_synced_at |
| external_people | venue_id, source, external_id (Tanda Payroll ID), external_name, external_email, user_id (manual link) |
| import_value_maps | venue_id, source, field (team / shift_detail / location), value, department_id, area_id, shift_type_id, is_manager |
| roster_shifts | external_person_id, user_id (resolved), trading_date, starts_at, ends_at (timestamptz), team, shift_detail, department_id, is_manager, batch_id, superseded_by_batch_id |

Overlapping shifts are replaced by setting `superseded_by_batch_id`, never by deleting.

**Revenue:** no revenue tables in phase 1. When the KPI snapshot arrives, it imports figures as reported through an adapter. RTF never derives them.

Excluded and why:
- **Billing.** It's out of scope.
- **The guest/VIP and onboarding tables.** They're phase 3.

---

## App structure

```
src/
  app/(auth)/sign-in, auth/callback
  app/v/[venue]/          today | checklists | handover | tasks | functions | runsheet | processes | incidents | maintenance | contacts | emergency | admin/*
  app/api/import/[kind]   parse + preview (server), commit via server action
  lib/supabase/{server,client,middleware}.ts
  lib/capabilities.ts     the capability catalogue
  lib/checklist/items.ts  zod item schema + range/exception evaluation (shared client/server)
  lib/import/             parse (SheetJS) → map → validate → preview → commit; kind-specific committers
  lib/roster/source.ts    RosterSource interface; adapters/tanda-csv.ts
  components/ui/          Button(xl), BigToggle, NumberPad, PhotoCapture, SignaturePad, Sheet
supabase/migrations, supabase/seed.sql (generic "Demo Venue"), supabase/seed/queens.sql (data only, not run by default)
tests/db/*.test.ts, tests/unit/*, tests/e2e/*
```

**Venue routing:**
- Routes use a path segment, `/v/{venue-slug}/…` (the `/v/` prefix stops a venue slug ever colliding with app routes like `/sign-in`).
- A venue picker appears for users with more than one venue.
- Subdomains can be added later with middleware rewrites, and no data change is needed.

---

## Build order (each step is a PR-sized, deployable commit)

1. **Scaffold, migrations 0001–0007 and RLS.**
   - Write the DB test harness.
   - The tenant isolation suite generates tests for every table. Two orgs and three venues are seeded. For every table it asserts that a user at venue A cannot select, insert, update or delete venue B rows, that a group owner can read across their org only, and that a suspended member sees nothing.
   - It also tests that the audit log is written and can't be modified.
   - CI workflow: typecheck, lint, unit tests, `supabase start` and DB tests.
2. **Auth.**
   - Magic link.
   - Microsoft (Azure provider). This needs an Entra app registration under the Queens tenant; you'll need to create it, and I'll document the redirect URIs.
   - Long refresh session, venue picker, admin users screen (invite, role, department, qualifications, suspend plus global sign-out).
3. **Template engine.** Item schema, template editor (draft, then publish creates a new version), and the run renderer with typed inputs and photo/signature capture to Storage.
4. **Open/mid/close per area and shift type.**
   - The "Today" screen for the trading date.
   - Start a run, late and missed flags (calculated from `due_at` on read, plus a "missed" sweep when the next trading day starts).
   - Closer gate, exceptions inbox.
5. **Handover.** Create from the current shift, carry tasks, dual sign-off, then lock.
6. **Tasks.** List, assign, priority, due, recurrence-on-completion, photo proof, comments, overdue badge. Realtime subscription for the list.
7. **Function run sheets.** Event record, one template, timeline entries, post-event notes.
8. **Shift run sheet (manual).** Managers, functions for the day, bookings/entertainment/promos/deliveries/targets as entries. It's auto-populated from events and roster shifts when present.
9. **Processes library.** Versioned steps with media, linked from checklist items, read acknowledgement, search (Postgres FTS).
10. **Excel SOP import.**
    - Upload, auto-suggest the column map, preview with unmapped rows, then commit as drafts (process or checklist template).
    - A re-upload matched on `source_key` creates a new version.
11. **Incidents** (restricted types), **maintenance log**, **contacts and call tree**, and the **emergency** screen.
12. **Tanda roster CSV import.** It uses the same importer with a saved per-venue mapping, plus batch history and a "roster last updated" timestamp. The column handling below comes from the real export (see the Tanda sample section).
13. **PWA and polish.**
    - Manifest, icons, install prompt, app-shell service worker, dark mode default after trading-hours sunset, large-text setting.
    - Shared-tablet PIN unlock: the server verifies the bcrypt PIN, then mints a real session for that staff member through the admin API, so RLS still applies per person. It auto-locks when idle.

**Seed:** a generic "Demo Venue" with sample roles, areas, short open/close templates, a handful of processes and contacts. Queens defaults (roles, QLD compliance rules, departments) go in a separate data-only seed for the pilot.

---

## Tanda sample: what the real export changes

Source file: `rostered_shift_report_from_2026-09-28_to_2026-10-04_….csv`. It has 257 shifts, 54 people, UTF-8 with a BOM, and 25 columns.

| Finding | Design response |
|---|---|
| **No email column** | Match people on **Payroll ID**, stored on `external_people.external_id`. Fall back to first+last name, then a manual link. The brief's "email first" rule can't work with this export. One person has a blank Payroll ID, so name matching is the fallback for them. |
| **No qualification or expiry columns** | Licence/RSA/RCG expiries are entered by hand on the user record, or loaded from a separate Tanda Qualifications export. That export needs its own sample before its mapping is built. |
| `Start`/`Finish` are naive local datetimes (`2026-09-28 08:00:00`), and 33 shifts cross midnight | Interpret them in `venue_settings.timezone`. `Date` is the start date, and the trading date is derived using `trading_day_cutover`. |
| `Team` holds 32 values (Management, Sports Bar, Gaming, House keeping, Retail Shop 1…) | A per-venue **team map**, `import_value_maps(source, field='team', value → department_id/area_id, is_manager bool)`. Unknown teams appear in the preview for an admin to map once. |
| `Shift Detail` is mostly blank, but holds Open/Close/Mid for Management shifts | Map it with the same value map to `shift_types`. A Management shift with "Close" pre-selects that manager as the closer, still subject to the qualification check. |
| `Location` holds one value | Map Location to venue, so a group running several venues can use one export later. |
| The file covers a fixed window (Mon–Sun, also in the filename) | **Replace by window.** On commit, live `roster_shifts` for that venue whose trading date falls in the file's min–max `Date` range and which aren't in the new file are superseded. This catches shifts deleted in Tanda, which "overlap" matching would miss. The identity key is `(payroll_id, start)`, and the sample has no duplicates. |
| `Cost` is always 0.0; break columns, award tags and the publish/accept status are present | Kept in `import_rows.raw` for traceability but not mapped. RTF doesn't read cost. Award tags (`Salaried,Managerial`) can optionally hint at the role during manual linking. |

The sample contains real staff data, so it is **not committed**. The test fixture is a synthetic CSV with identical headers.

## Scope gaps in the brief (flagging, not deviating)

The brief's compliance section lists these features, but the 13-step build order never schedules them:
- **Form 3B self-exclusion** workflow.
- **Promotion/advertising sign-off gates** and their pre-publish checklist.
- **Cash/AML escalation.**

**What phase 1 does:**
- It ships the data structures (`approvals`, `compliance_rules`, `incident_types`).
- It enforces the closer gate and cash-variance exceptions, because these come for free from the checklist engine.
- It does **not** build the Form 3B or promotion approval UI.

I recommend these as a short "1b" straight after step 13. I'll confirm with you before building them.

**Expiry watch:** the 60/30-day flags show in-app in phase 1. Push and email delivery is phase 2.

---

## Things I need from you (none block steps 1–11)

1. **Create the Supabase project** `run-the-floor` in ap-southeast-2. Your plan may cap the number of active projects. Alternatively, approve me creating it through the Supabase MCP, which may incur cost.
2. **A Vercel project** in "The Queens Gladstone" team, linked to the repo.
3. **The Tanda Qualifications export, if Tanda offers one** (step 12). The roster export is already received. Without a qualifications export, expiries are entered by hand.
4. **An Entra app registration** for Microsoft sign-in (step 2). Magic link works without it.
5. **Repo ownership:** the code is currently under `mitch-netizen`. The brief says a private repo under vm@queensgladstone.au. A transfer later is painless; nothing in the code depends on it.

---

## Verification

- `pnpm typecheck && pnpm lint && pnpm test`: unit tests cover the item schema, range evaluation, import mapping and the roster matcher.
- `pnpm test:db`:
  - the full tenant-isolation matrix on every table;
  - capability checks (non-closer can't close out, unqualified manager can't be set as closer, completed run can't be edited, nothing can be deleted, audit rows written).
  - It runs here against local PG16 plus the auth shim, and in CI against `supabase start`.
- `pnpm test:e2e` (Playwright, mobile viewport):
  - sign in as the demo duty manager;
  - complete the open checklist with an out-of-range temperature, raise and resolve the exception, close out;
  - hand over;
  - import the sample SOP xlsx, then re-import it and get a new version.
- Manual: a Vercel preview deploy per PR. You install the PWA on a phone and walk a close.
