#!/usr/bin/env bash
# Spins up a throwaway Postgres cluster, applies the Supabase shim and all
# migrations, then runs the DB test suite against it. No Docker needed.
#   PG_BIN can point at a Postgres 15+ bin dir (default: /usr/lib/postgresql/16/bin).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PORT="${PG_PORT:-54329}"
DATA="$(mktemp -d)"
SOCK="$DATA/sock"
mkdir -p "$SOCK"

cleanup() { "$PG_BIN/pg_ctl" -D "$DATA/pg" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

run_as() { if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
if [ "$(id -u)" = "0" ]; then chown -R postgres "$DATA"; fi

run_as "'$PG_BIN/initdb' -D '$DATA/pg' -U postgres --auth=trust -E UTF8 >/dev/null"
run_as "'$PG_BIN/pg_ctl' -D '$DATA/pg' -o \"-p $PORT -k $SOCK -c listen_addresses=''\" -w start >/dev/null"

PSQL=(psql -X -q -o /dev/null -v ON_ERROR_STOP=1 -h "$SOCK" -p "$PORT" -U postgres -d postgres)
"${PSQL[@]}" -f "$ROOT/tests/db/supabase-shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  "${PSQL[@]}" -f "$f"
done

export DATABASE_URL="postgresql://postgres@localhost:$PORT/postgres?host=$SOCK"
cd "$ROOT"
if [ "${SKIP_TESTS:-}" = "1" ]; then echo "migrations applied"; exit 0; fi
pnpm exec vitest run --project db "$@"
