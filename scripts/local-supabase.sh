#!/usr/bin/env bash
# Bring up a self-contained local Supabase stack for development.
#
# The committed migrations in supabase/migrations/ use non-unique numeric
# prefixes (several 012_/014_/015_/016_ files) because they are applied by hand
# in the hosted Supabase SQL editor, not through the CLI's migration tracker.
# `supabase start` rejects duplicate version keys, so this script starts the
# stack with an empty migration set and then applies every migration file in
# filename order directly via psql, which has no such uniqueness constraint.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIG_DIR="$ROOT/supabase/migrations"
STASH_DIR="$ROOT/supabase/.migrations-stash"

restore_migrations() {
  if [ -d "$STASH_DIR" ]; then
    shopt -s dotglob nullglob
    mv "$STASH_DIR"/* "$MIG_DIR"/ 2>/dev/null || true
    shopt -u dotglob nullglob
    rmdir "$STASH_DIR" 2>/dev/null || true
  fi
}
trap restore_migrations EXIT

# Move migrations aside so `supabase start` brings up a clean, empty database.
mkdir -p "$STASH_DIR"
shopt -s nullglob
for f in "$MIG_DIR"/*; do
  mv "$f" "$STASH_DIR"/
done
shopt -u nullglob

cd "$ROOT"
supabase start "$@"

# Apply every migration (and stashed SQL) in filename order, skipping the
# diagnostic-only file that the CLI also skips.
DB_URL="$(supabase status -o json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).DB_URL))')"
echo "Applying migrations to $DB_URL"

# Local-dev shim: migration 021_rbac_policies.sql defines RLS policies on a
# `business_pages` table that no migration creates (it exists only in the hosted
# database and is unused by the app). Create a minimal stand-in just before that
# migration runs so the policy statements apply cleanly under ON_ERROR_STOP.
apply_business_pages_shim() {
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
create table if not exists public.business_pages (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);
alter table public.business_pages enable row level security;
SQL
}
for f in $(ls "$STASH_DIR"/*.sql | sort); do
  base="$(basename "$f")"
  if [ "$base" = "diagnostic.sql" ]; then
    echo "Skipping $base"
    continue
  fi
  if [ "$base" = "021_rbac_policies.sql" ]; then
    echo "Creating local business_pages shim"
    apply_business_pages_shim
  fi
  echo "Applying $base"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done

echo "Local Supabase is ready. Migrations applied."
supabase status
