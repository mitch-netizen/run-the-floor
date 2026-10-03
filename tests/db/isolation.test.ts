import { describe, expect, it } from "vitest";
import {
  USER, VENUE, actAs, actAsOwner, allPublicTables, count, expectSqlError, tenantTables, tx, type Db,
} from "./db";

// Tenant isolation matrix. Tables are discovered from the schema, so a new
// tenant table is covered automatically (and fails until it has fixtures).

const tables = await tenantTables();
const VENUES = [VENUE.A1, VENUE.A2, VENUE.B];
// Reads gated on a capability, so a group owner without a membership sees none.
const MEMBER_ONLY_READ = new Set(["import_rows"]);

/** Rows affected by a write; 0 when the role isn't permitted to make it at all. */
async function updateCount(db: Db, sql: string, params: unknown[]) {
  await db.query("savepoint upd");
  try {
    const res = await db.query(sql, params);
    await db.query("release savepoint upd");
    return res.rowCount;
  } catch (err) {
    await db.query("rollback to savepoint upd");
    if ((err as { code?: string }).code === "42501") return 0;
    throw err;
  }
}

async function rowOf(db: Db, table: string, venueId: string) {
  const { rows } = await db.query(`select to_jsonb(t) as row from public.${table} t where venue_id = $1 limit 1`, [venueId]);
  expect(rows.length, `${table} has a fixture row in ${venueId}`).toBe(1);
  return rows[0].row as Record<string, unknown>;
}

/** Insert a copy of another venue's row (fresh id) as the current role. */
function insertCopySql(table: string) {
  return `insert into public.${table} select * from jsonb_populate_record(null::public.${table}, $1::jsonb)`;
}
function withFreshId(row: Record<string, unknown>) {
  return "id" in row ? { ...row, id: crypto.randomUUID() } : row;
}

it("discovers the tenant tables", () => {
  expect(tables.length).toBeGreaterThan(30);
});

it("every public table has RLS enabled", async () => {
  await tx(async (db) => {
    const { rows } = await db.query(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
    expect(rows.map((r) => r.relname)).toEqual([]);
  });
});

it("every tenant table has fixture rows in every venue", async () => {
  await tx(async (db) => {
    for (const table of tables) {
      for (const venue of VENUES) {
        expect(await count(db, `select 1 from public.${table} where venue_id = $1`, [venue]), `${table} @ ${venue}`)
          .toBeGreaterThan(0);
      }
    }
  });
});

describe.each(tables)("%s", (table) => {
  it.each([
    ["admin of A1 vs venue B", USER.adminA1, VENUE.A1, VENUE.B],
    ["admin of B vs venue A1", USER.adminB, VENUE.B, VENUE.A1],
    ["admin of A2 vs sibling venue A1", USER.adminA2, VENUE.A2, VENUE.A1],
  ])("%s: cannot read, write, move or delete across venues", async (_label, user, own, other) => {
    await tx(async (db) => {
      const otherRow = await rowOf(db, table, other);
      const ownRow = await rowOf(db, table, own);
      await actAs(db, user);

      // Read: sees own venue, never the other.
      expect(await count(db, `select 1 from public.${table} where venue_id = $1`, [own])).toBeGreaterThan(0);
      expect(await count(db, `select 1 from public.${table} where venue_id = $1`, [other])).toBe(0);

      // Insert into the other venue is rejected by RLS.
      await expectSqlError(db, insertCopySql(table), [JSON.stringify(withFreshId(otherRow))]);

      // Update of the other venue's rows touches nothing (or is not granted at all).
      expect(await updateCount(db, `update public.${table} set venue_id = venue_id where venue_id = $1`, [other])).toBe(0);

      // Moving an own row into the other venue is rejected.
      const key = "id" in ownRow ? "id" : "venue_id";
      await expectSqlError(db, `update public.${table} set venue_id = $1 where ${key} = $2`, [other, ownRow[key]]);

      // Nothing is ever deleted, not even own rows.
      await expectSqlError(db, `delete from public.${table} where venue_id = $1`, [own]);
    });
  });

  it("group owner reads every venue in their organisation only, and cannot write", async () => {
    await tx(async (db) => {
      const a1Row = await rowOf(db, table, VENUE.A1);
      await actAs(db, USER.ownerOrg1);
      if (MEMBER_ONLY_READ.has(table)) {
        expect(await count(db, `select 1 from public.${table}`)).toBe(0);
      } else {
        expect(await count(db, `select 1 from public.${table} where venue_id = $1`, [VENUE.A1])).toBeGreaterThan(0);
        expect(await count(db, `select 1 from public.${table} where venue_id = $1`, [VENUE.A2])).toBeGreaterThan(0);
      }
      expect(await count(db, `select 1 from public.${table} where venue_id = $1`, [VENUE.B])).toBe(0);
      await expectSqlError(db, insertCopySql(table), [JSON.stringify(withFreshId(a1Row))]);
    });
  });

  it("suspended member sees nothing and cannot write", async () => {
    await tx(async (db) => {
      const a1Row = await rowOf(db, table, VENUE.A1);
      await actAs(db, USER.suspendedA1);
      const visible = await count(db, `select 1 from public.${table} where venue_id = $1`, [VENUE.A1]);
      // The only thing a suspended member can read is their own membership row.
      if (table === "memberships") {
        expect(await count(db, `select 1 from public.memberships where user_id <> $1`, [USER.suspendedA1])).toBe(0);
      } else {
        expect(visible).toBe(0);
      }
      await expectSqlError(db, insertCopySql(table), [JSON.stringify(withFreshId(a1Row))]);
    });
  });

  it("anonymous requests have no access", async () => {
    await tx(async (db) => {
      await actAs(db, null);
      await expectSqlError(db, `select 1 from public.${table} limit 1`);
    });
  });
});

describe("non-tenant tables", () => {
  it("anon cannot read any public table", async () => {
    const all = await allPublicTables();
    await tx(async (db) => {
      await actAs(db, null);
      for (const table of all) await expectSqlError(db, `select 1 from public.${table} limit 1`);
    });
  });

  it("organisations and venues are visible only through membership", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      expect((await db.query("select slug from public.organisations order by slug")).rows.map((r) => r.slug)).toEqual(["org-one"]);
      expect((await db.query("select slug from public.venues order by slug")).rows.map((r) => r.slug)).toEqual(["venue-a1"]);

      await actAs(db, USER.ownerOrg1);
      expect((await db.query("select slug from public.venues order by slug")).rows.map((r) => r.slug)).toEqual(["venue-a1", "venue-a2"]);

      await actAs(db, USER.adminB);
      expect((await db.query("select slug from public.venues order by slug")).rows.map((r) => r.slug)).toEqual(["venue-b"]);
      // Venues and organisations are provisioned by the platform, not by API users.
      await expectSqlError(db, "insert into public.organisations (name, slug) values ('X', 'x')");
      await expectSqlError(db, `insert into public.venues (organisation_id, name, slug) values ('10000000-0000-0000-0000-000000000002', 'X', 'x')`);
    });
  });

  it("profiles are visible only to people who share a venue", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      const ids = (await db.query("select id from public.profiles")).rows.map((r) => r.id);
      expect(ids).toContain(USER.staffA1);
      expect(ids).not.toContain(USER.adminB);
      expect(ids).not.toContain(USER.adminA2);
      // Can't edit someone else's profile.
      const upd = await db.query("update public.profiles set full_name = 'x' where id = $1", [USER.staffA1]);
      expect(upd.rowCount).toBe(0);
    });
  });

  it("audit log is venue scoped, needs audit.view, and is append only", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      expect(await count(db, "select 1 from public.audit_log where venue_id = $1", [VENUE.A1])).toBeGreaterThan(0);
      expect(await count(db, "select 1 from public.audit_log where venue_id <> $1", [VENUE.A1])).toBe(0);
      await expectSqlError(db, "insert into public.audit_log (table_name, record_id, action) values ('x', 'x', 'insert')");
      await expectSqlError(db, "delete from public.audit_log");

      await actAs(db, USER.staffA1);
      expect(await count(db, "select 1 from public.audit_log")).toBe(0);

      // Not even the database owner can rewrite history.
      await actAsOwner(db);
      await expectSqlError(db, "update public.audit_log set action = 'delete'");
      await expectSqlError(db, "delete from public.audit_log");
    });
  });
});

describe("storage", () => {
  it("objects are readable and writable only under the user's own venue prefix", async () => {
    await tx(async (db) => {
      await actAs(db, USER.adminA1);
      const names = (await db.query("select name from storage.objects where bucket_id = 'evidence'")).rows.map((r) => r.name);
      expect(names).toEqual([`${VENUE.A1}/run/photo.jpg`]);
      await db.query("insert into storage.objects (bucket_id, name) values ('evidence', $1)", [`${VENUE.A1}/x.jpg`]);
      await expectSqlError(db, "insert into storage.objects (bucket_id, name) values ('evidence', $1)", [`${VENUE.B}/x.jpg`]);
      await expectSqlError(db, "insert into storage.objects (bucket_id, name) values ('evidence', 'no-venue.jpg')");
      // Nothing is removed: no delete policy here, and Supabase also blocks direct deletes.
      expect(await updateCount(db, "delete from storage.objects where bucket_id = 'evidence'", [])).toBe(0);
    });
  });

  it("import files need imports.run", async () => {
    await tx(async (db) => {
      await actAs(db, USER.staffA1);
      expect(await count(db, "select 1 from storage.objects where bucket_id = 'imports'")).toBe(0);
      await actAs(db, USER.adminA1);
      expect(await count(db, "select 1 from storage.objects where bucket_id = 'imports'")).toBe(1);
    });
  });
});
