@AGENTS.md

# Run The Floor

Multi-tenant PWA for licensed venues: checklists, run sheets, tasks, processes, handover.
Brief and phase 1 plan: `docs/PLAN.md`. Build order is fixed there; ask before deviating.

## Non-negotiables
- Nothing venue-specific in code (names, roles, rules, departments, checklists). It's all venue data.
- Every tenant table: `organisation_id` + `venue_id`, registered with `app.register_tenant_table(table, write_capability)`
  in its migration (composite FK to venues, tenant guard, audit trigger, RLS, no DELETE grant).
- Intra-tenant references use composite FKs `(x_id, venue_id) -> x(id, venue_id)`.
- Nothing is deleted, only archived (`archived_at`). Published versions and completed records are locked by triggers.
- Capabilities are a fixed catalogue (`src/lib/capabilities.ts` = `public.capabilities`); roles are venue data.
- Revenue is never calculated. Integrations are read-only adapters.
- Australian English in all copy.

## Commands
- `pnpm typecheck && pnpm lint && pnpm test` (unit)
- `pnpm test:db`: throwaway Postgres 16 + Supabase shim, all migrations, DB suite (no Docker)
- `pnpm test:db:supabase`: same suite against `supabase start` (`DATABASE_URL` on 54322)

A new tenant table must get a fixture row per venue in `tests/db/fixtures.sql`; the isolation suite
discovers tables automatically and fails until it has one.
