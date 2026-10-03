import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

// Loads the fixtures once (committed). Individual tests run in transactions
// that are rolled back, so the fixture state never drifts.
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (use pnpm test:db)");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(readFileSync(path.join(import.meta.dirname, "fixtures.sql"), "utf8"));
    const { rows } = await client.query("select 1 from public.organisations where slug = 'org-one'");
    if (rows.length === 0) await client.query("select test.load_fixtures()");
  } finally {
    await client.end();
  }
}
