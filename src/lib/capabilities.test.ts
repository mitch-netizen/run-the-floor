import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CAPABILITIES } from "./capabilities";

describe("capability catalogue", () => {
  it("matches the database catalogue seeded in migration 0001", () => {
    const sql = readFileSync(
      path.join(import.meta.dirname, "../../supabase/migrations/20261003000001_tenancy.sql"),
      "utf8",
    );
    const block = sql.slice(sql.indexOf("insert into public.capabilities"), sql.indexOf(";", sql.indexOf("insert into public.capabilities")));
    const keys = [...block.matchAll(/\('([a-z_.]+)',/g)].map((m) => m[1]);
    expect(keys).toEqual([...CAPABILITIES]);
  });
});
