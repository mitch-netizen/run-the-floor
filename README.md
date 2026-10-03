# Run The Floor

A second set of eyes for whoever is running the floor: checklists, run sheets, tasks, processes and handover,
built multi-tenant from day one. The Queens Hotel Gladstone is the pilot venue.

Stack: Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres, Auth, Storage, Realtime) · Vercel.

- Plan, schema and build order: [`docs/PLAN.md`](docs/PLAN.md)
- Migrations: `supabase/migrations/`
- Tenant isolation and rule tests: `tests/db/`

## Develop

```bash
pnpm install
pnpm dev                 # app on :3000
pnpm test:db             # DB suite on a throwaway Postgres 16 (PG_BIN to override)
pnpm exec supabase start # full local stack (Docker), then: pnpm test:db:supabase
```

Copy `.env.example` to `.env.local` and fill in the Supabase project values.
