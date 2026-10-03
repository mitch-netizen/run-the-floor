import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { count, tx } from "./db";

const seed = readFileSync(path.join(import.meta.dirname, "../../supabase/seed.sql"), "utf8");

it("seed creates the demo venue once and is safe to re-run", async () => {
  await tx(async (db) => {
    await db.query(seed);
    await db.query(seed);
    const { rows } = await db.query("select id from public.venues where slug = 'demo'");
    expect(rows).toHaveLength(1);
    const v = rows[0].id;
    expect(await count(db, "select 1 from public.roles where venue_id = $1", [v])).toBe(7);
    expect(await count(db, "select 1 from public.venue_areas where venue_id = $1", [v])).toBe(7);
    expect(await count(db, "select 1 from public.shift_types where venue_id = $1 and is_venue_close", [v])).toBe(1);
    expect(await count(db, "select 1 from public.incident_types where venue_id = $1 and restricted", [v])).toBe(3);
  });
});
