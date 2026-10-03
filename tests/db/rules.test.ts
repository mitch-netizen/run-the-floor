import { describe, expect, it } from "vitest";
import { USER, VENUE, actAs, actAsOwner, count, expectSqlError, tx, type Db } from "./db";

async function one<T = Record<string, unknown>>(db: Db, sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await db.query(sql, params);
  expect(rows.length, sql).toBe(1);
  return rows[0] as T;
}

describe("capabilities", () => {
  it("staff can answer checklists but not manage templates, tasks or settings", async () => {
    await tx(async (db) => {
      const run = await one<{ id: string }>(db, "select id from public.checklist_runs where venue_id = $1", [VENUE.A1]);
      await actAs(db, USER.staffA1);
      await db.query("update public.run_items set value = '4' where run_id = $1", [run.id]);
      await expectSqlError(db, "insert into public.checklist_templates (venue_id, name) values ($1, 'X')", [VENUE.A1]);
      await expectSqlError(db, "insert into public.tasks (venue_id, title) values ($1, 'X')", [VENUE.A1]);
      await expectSqlError(db, "insert into public.departments (venue_id, name) values ($1, 'X')", [VENUE.A1]);
      const upd = await db.query("update public.venue_settings set jurisdiction = 'X' where venue_id = $1", [VENUE.A1]);
      expect(upd.rowCount).toBe(0);
    });
  });

  it("role capabilities must come from the catalogue", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      await expectSqlError(db, "insert into public.roles (venue_id, name, capabilities) values ($1, 'X', '{made.up}')", [VENUE.A1], "23514");
    });
  });

  it("a task owner can progress their task but not edit its other fields", async () => {
    await tx(async (db) => {
      const task = await one<{ id: string }>(db, "select id from public.tasks where venue_id = $1", [VENUE.A1]);
      await db.query("update public.tasks set owner_user_id = $1 where id = $2", [USER.staffA1, task.id]);
      await actAs(db, USER.staffA1);
      const done = await db.query("update public.tasks set status = 'done', completed_at = now(), completed_by = $1 where id = $2", [USER.staffA1, task.id]);
      expect(done.rowCount).toBe(1);
      await expectSqlError(db, "update public.tasks set title = 'renamed' where id = $1", [task.id]);
      await expectSqlError(db, "update public.tasks set owner_user_id = $1 where id = $2", [USER.adminA1, task.id]);
    });
  });
});

describe("history is immutable", () => {
  it("published template versions cannot change", async () => {
    await tx(async (db) => {
      const v = await one<{ id: string }>(db, "select id from public.checklist_template_versions where venue_id = $1", [VENUE.A1]);
      await actAs(db, USER.adminA1);
      await expectSqlError(db, "update public.checklist_template_versions set items = '[]' where id = $1", [v.id]);
    });
  });

  it("completed checklist runs and their answers are locked", async () => {
    await tx(async (db) => {
      const run = await one<{ id: string }>(db, "select id from public.checklist_runs where venue_id = $1", [VENUE.A1]);
      await actAs(db, USER.adminA1);
      await db.query("update public.checklist_runs set status = 'completed', completed_at = now(), completed_by = $1 where id = $2", [USER.adminA1, run.id]);
      await expectSqlError(db, "update public.checklist_runs set late = true where id = $1", [run.id]);
      await expectSqlError(db, "update public.run_items set value = '9' where run_id = $1", [run.id]);
      await expectSqlError(db, "insert into public.run_items (venue_id, run_id, item_key, value) values ($1, $2, 'new', '1')", [VENUE.A1, run.id]);
    });
  });

  it("a handover signed by both managers is locked", async () => {
    await tx(async (db) => {
      const h = await one<{ id: string }>(db, "select id from public.handovers where venue_id = $1", [VENUE.A1]);
      await actAs(db, USER.adminA1);
      await db.query("update public.handovers set outgoing_signed_at = now(), incoming_user_id = $1, incoming_signed_at = now() where id = $2", [USER.staffA1, h.id]);
      await expectSqlError(db, "update public.handovers set notes = 'edited' where id = $1", [h.id]);
    });
  });

  it("every change is audited with the actor, before and after", async () => {
    await tx(async (db) => {
      const c = await one<{ id: string }>(db, "select id from public.contacts where venue_id = $1", [VENUE.A1]);
      await actAs(db, USER.adminA1);
      await db.query("update public.contacts set name = 'Sparky' where id = $1", [c.id]);
      const entry = await one<{ actor_user_id: string; before: { name: string }; after: { name: string }; venue_id: string }>(
        db, "select actor_user_id, before, after, venue_id from public.audit_log where table_name = 'contacts' and record_id = $1 and action = 'update'", [c.id]);
      expect(entry.actor_user_id).toBe(USER.adminA1);
      expect(entry.venue_id).toBe(VENUE.A1);
      expect(entry.before.name).toBe("Electrician");
      expect(entry.after.name).toBe("Sparky");
    });
  });
});

describe("tenant integrity (enforced below RLS)", () => {
  it("rows cannot reference another venue's records, even as the database owner", async () => {
    await tx(async (db) => {
      const bVersion = await one<{ id: string }>(db, "select id from public.checklist_template_versions where venue_id = $1", [VENUE.B]);
      await expectSqlError(db,
        "insert into public.checklist_runs (venue_id, template_version_id, trading_date) values ($1, $2, current_date)",
        [VENUE.A1, bVersion.id], "23503");
    });
  });

  it("organisation_id is derived from the venue and cannot be spoofed", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      const row = await one<{ organisation_id: string }>(db,
        "insert into public.contacts (venue_id, name) values ($1, 'Plumber') returning organisation_id", [VENUE.A1]);
      expect(row.organisation_id).toBe("10000000-0000-0000-0000-000000000001");
      await expectSqlError(db,
        "insert into public.contacts (venue_id, organisation_id, name) values ($1, '10000000-0000-0000-0000-000000000002', 'X')", [VENUE.A1]);
    });
  });

  it("venue timezone must be a real timezone", async () => {
    await tx(async (db) => {
      await expectSqlError(db, "update public.venue_settings set timezone = 'Mars/Olympus' where venue_id = $1", [VENUE.A1], "23514");
    });
  });

  it("new auth users get a profile", async () => {
    await tx(async (db) => {
      await db.query("insert into auth.users (id, email, raw_user_meta_data) values (gen_random_uuid(), 'new@test', '{\"full_name\":\"New Person\"}')");
      expect(await count(db, "select 1 from public.profiles where email = 'new@test' and full_name = 'New Person'")).toBe(1);
    });
  });
});

describe("compliance", () => {
  it("restricted incidents are hidden without incidents.view_restricted, regardless of later type edits", async () => {
    await tx(async (db) => {
      const type = await one<{ id: string }>(db,
        "insert into public.incident_types (venue_id, name, restricted) values ($1, 'Self exclusion', true) returning id", [VENUE.A1]);
      // Inserted as a client claiming restricted = false: the type wins.
      await actAs(db, USER.adminA1);
      await db.query("insert into public.incidents (venue_id, incident_type_id, occurred_at, description, restricted) values ($1, $2, now(), 'Excluded patron', false)", [VENUE.A1, type.id]);
      expect(await count(db, "select 1 from public.incidents where restricted")).toBe(1);

      // Staff role lacks incidents.view_restricted.
      await actAs(db, USER.staffA1);
      expect(await count(db, "select 1 from public.incidents where restricted")).toBe(0);
      expect(await count(db, "select 1 from public.incidents where not restricted")).toBe(1);

      // Unflagging the type later does not expose the record.
      await actAsOwner(db);
      await db.query("update public.incident_types set restricted = false where id = $1", [type.id]);
      await actAs(db, USER.staffA1);
      expect(await count(db, "select 1 from public.incidents where restricted")).toBe(0);
    });
  });

  it("anyone can request an approval as themselves; only an approver can decide; decisions are final", async () => {
    await tx(async (db) => {
      await actAs(db, USER.staffA1);
      await expectSqlError(db, "insert into public.approvals (venue_id, subject_type, summary, requested_by) values ($1, 'gaming_promotion', 'X', $2)", [VENUE.A1, USER.adminA1]);
      await expectSqlError(db, "insert into public.approvals (venue_id, subject_type, summary, decision, decided_by, decided_at) values ($1, 'gaming_promotion', 'X', 'approved', $2, now())", [VENUE.A1, USER.staffA1]);
      const req = await one<{ id: string }>(db,
        "insert into public.approvals (venue_id, subject_type, summary) values ($1, 'gaming_promotion', 'Melbourne Cup promo') returning id", [VENUE.A1]);
      const self = await db.query("update public.approvals set decision = 'approved', decided_by = $1, decided_at = now() where id = $2", [USER.staffA1, req.id]);
      expect(self.rowCount).toBe(0);

      await actAs(db, USER.adminA1);
      const ok = await db.query("update public.approvals set decision = 'approved', decided_by = $1, decided_at = now() where id = $2", [USER.adminA1, req.id]);
      expect(ok.rowCount).toBe(1);
      await expectSqlError(db, "update public.approvals set decision = 'rejected' where id = $1", [req.id]);
    });
  });

  it("raw import rows (staff personal data) are visible to importers only", async () => {
    await tx(async (db) => {
      await actAs(db, USER.staffA1);
      expect(await count(db, "select 1 from public.import_rows")).toBe(0);
      await actAs(db, USER.adminA1);
      expect(await count(db, "select 1 from public.import_rows")).toBeGreaterThan(0);
    });
  });
});
