import pg from "pg";
import { afterAll } from "vitest";

export const VENUE = {
  A1: "20000000-0000-0000-0000-0000000000a1",
  A2: "20000000-0000-0000-0000-0000000000a2",
  B: "20000000-0000-0000-0000-0000000000b1",
} as const;

export const USER = {
  adminA1: "00000000-0000-0000-0000-0000000000a1",
  staffA1: "00000000-0000-0000-0000-0000000000a2",
  suspendedA1: "00000000-0000-0000-0000-0000000000a3",
  adminA2: "00000000-0000-0000-0000-0000000000a4",
  ownerOrg1: "00000000-0000-0000-0000-0000000000a5",
  adminB: "00000000-0000-0000-0000-0000000000b1",
} as const;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
afterAll(() => pool.end());

export type Db = pg.PoolClient;

/** Runs fn inside a transaction that is always rolled back. */
export async function tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("begin");
    return await fn(db);
  } finally {
    await db.query("rollback");
    db.release();
  }
}

/** Switch the transaction to an API role, impersonating a user like PostgREST does. */
export async function actAs(db: Db, userId: string | null) {
  if (userId === null) {
    await db.query("set local role anon");
    await db.query("select set_config('request.jwt.claims', '{\"role\":\"anon\"}', true)");
    return;
  }
  await db.query("set local role authenticated");
  await db.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
}

/** Back to the owner role (bypasses RLS) for arranging data inside a test. */
export async function actAsOwner(db: Db) {
  await db.query("reset role");
  await db.query("select set_config('request.jwt.claims', '', true)");
}

/** Run a statement that must fail with the given SQLSTATE, without aborting the transaction. */
export async function expectSqlError(db: Db, sql: string, params: unknown[] = [], code = "42501") {
  await db.query("savepoint expect_error");
  try {
    await db.query(sql, params);
  } catch (err) {
    await db.query("rollback to savepoint expect_error");
    const actual = (err as { code?: string }).code;
    if (actual !== code) {
      throw new Error(`expected SQLSTATE ${code}, got ${actual}: ${(err as Error).message}\n  ${sql}`);
    }
    return;
  }
  throw new Error(`expected SQLSTATE ${code} but statement succeeded:\n  ${sql}`);
}

export async function count(db: Db, sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await db.query(`select count(*)::int as n from (${sql}) s`, params);
  return rows[0].n;
}

/** Tables in public that carry venue_id (the tenant tables). */
export async function tenantTables(): Promise<string[]> {
  const { rows } = await pool.query(`
    select c.table_name from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and c.column_name = 'venue_id' and t.table_type = 'BASE TABLE'
      and c.table_name <> 'audit_log'
    order by 1`);
  return rows.map((r) => r.table_name);
}

export async function allPublicTables(): Promise<string[]> {
  const { rows } = await pool.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`);
  return rows.map((r) => r.table_name);
}
