import { describe, expect, it } from "vitest";
import { USER, VENUE, actAs, actAsOwner, count, expectSqlError, tx } from "./db";

describe("my_venues", () => {
  it("returns each reachable venue with the caller's role and capabilities", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      const { rows } = await db.query("select * from public.my_venues()");
      expect(rows.map((r) => r.venue_id)).toEqual([VENUE.A1]);
      expect(rows[0].role_name).toBe("Admin");
      expect(rows[0].capabilities).toContain("users.manage");
      expect(rows[0].is_group_owner).toBe(false);

      await actAs(db, USER.staffA1);
      const staff = (await db.query("select * from public.my_venues()")).rows;
      expect(staff[0].capabilities).toEqual(["checklist.run"]);
    });
  });

  it("group owners see every org venue without capabilities; suspended members see none", async () => {
    await tx(async (db) => {
      await actAs(db, USER.ownerOrg1);
      const { rows } = await db.query("select * from public.my_venues()");
      expect(rows.map((r) => r.venue_id).sort()).toEqual([VENUE.A1, VENUE.A2].sort());
      expect(rows.every((r) => r.is_group_owner && r.capabilities.length === 0)).toBe(true);

      await actAs(db, USER.suspendedA1);
      expect(await count(db, "select * from public.my_venues()")).toBe(0);
    });
  });

  it("has_capability mirrors the caller's role", async () => {
    await tx(async (db) => {
      await actAs(db, USER.staffA1);
      expect((await db.query("select public.has_capability($1, 'checklist.run') ok", [VENUE.A1])).rows[0].ok).toBe(true);
      expect((await db.query("select public.has_capability($1, 'users.manage') ok", [VENUE.A1])).rows[0].ok).toBe(false);
      expect((await db.query("select public.has_capability($1, 'checklist.run') ok", [VENUE.B])).rows[0].ok).toBe(false);
    });
  });
});

describe("revoke_user_sessions", () => {
  it("lets a user manager sign out someone suspended at their venue, and nobody else", async () => {
    await tx(async (db) => {
      await db.query(
        "insert into auth.sessions (id, user_id) values (gen_random_uuid(), $1), (gen_random_uuid(), $1), (gen_random_uuid(), $2)",
        [USER.suspendedA1, USER.staffA1]);

      // Not suspended -> refused.
      await actAs(db, USER.adminA1);
      await expectSqlError(db, "select public.revoke_user_sessions($1)", [USER.staffA1]);
      // Another venue's manager -> refused.
      await actAs(db, USER.adminB);
      await expectSqlError(db, "select public.revoke_user_sessions($1)", [USER.suspendedA1]);
      // No users.manage -> refused.
      await actAs(db, USER.staffA1);
      await expectSqlError(db, "select public.revoke_user_sessions($1)", [USER.suspendedA1]);

      await actAs(db, USER.adminA1);
      const { rows } = await db.query("select public.revoke_user_sessions($1) n", [USER.suspendedA1]);
      expect(rows[0].n).toBe(2);

      await actAsOwner(db);
      expect(await count(db, "select 1 from auth.sessions where user_id = $1", [USER.suspendedA1])).toBe(0);
      expect(await count(db, "select 1 from auth.sessions where user_id = $1", [USER.staffA1])).toBe(1);
      expect(await count(db,
        "select 1 from public.audit_log where table_name = 'auth.sessions' and record_id = $1 and actor_user_id = $2",
        [USER.suspendedA1, USER.adminA1])).toBe(1);
    });
  });
});

describe("provisioning", () => {
  it("creates a venue with settings and the editable starter roles", async () => {
    await tx(async (db) => {
      const { rows } = await db.query(
        "select app.provision_venue('demo-group', 'Demo Group', 'demo-venue', 'Demo Venue', 'Australia/Brisbane', 'AU-QLD', 'Demo Pty Ltd') id");
      const venue = rows[0].id;
      const roles = (await db.query("select name from public.roles where venue_id = $1 order by sort", [venue])).rows.map((r) => r.name);
      expect(roles).toEqual([
        "Admin", "Licensed Duty Manager", "Non-closing Manager", "Shift Supervisor", "Department Lead", "Staff", "Read Only",
      ]);
      const settings = (await db.query(
        "select s.timezone, r.name approver from public.venue_settings s join public.roles r on r.id = s.nominated_approver_role_id where s.venue_id = $1",
        [venue])).rows[0];
      expect(settings).toEqual({ timezone: "Australia/Brisbane", approver: "Admin" });

      // A second venue in the same group reuses the organisation.
      const second = (await db.query(
        "select app.provision_venue('demo-group', 'Demo Group', 'demo-venue-2', 'Demo Venue 2', 'Australia/Brisbane', 'AU-QLD') id")).rows[0].id;
      expect(await count(db,
        "select 1 from public.venues a join public.venues b on a.organisation_id = b.organisation_id where a.id = $1 and b.id = $2",
        [venue, second])).toBe(1);

      // grant_membership gives a signed-up user a role.
      await db.query("select app.grant_membership('admin_a1@test', 'demo-venue', 'Licensed Duty Manager')");
      expect(await count(db,
        "select 1 from public.memberships m join public.roles r on r.id = m.role_id where m.venue_id = $1 and m.user_id = $2 and r.name = 'Licensed Duty Manager'",
        [venue, USER.adminA1])).toBe(1);
    });
  });

  it("is not callable through the API", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      await expectSqlError(db, "select app.provision_venue('x', 'X', 'x', 'X', 'UTC', 'X')");
      await expectSqlError(db, "select app.grant_membership('admin_a1@test', 'venue-a1', 'Admin')");
    });
  });
});
