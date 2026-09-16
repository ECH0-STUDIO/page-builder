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

DB_URL="$(supabase status -o json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).DB_URL))')"

# Idempotence guard: if the schema is already applied (fresh `supabase start`
# on an existing volume), do not replay migrations — they are not written with
# IF NOT EXISTS guards and would fail under ON_ERROR_STOP.
ALREADY_APPLIED="$(psql "$DB_URL" -tAqc "select to_regclass('public.businesses') is not null" 2>/dev/null || echo f)"
if [ "$ALREADY_APPLIED" = "t" ]; then
  echo "Schema already applied — skipping migration replay."
  supabase status
  exit 0
fi

# Apply every migration (and stashed SQL) in filename order, skipping the
# diagnostic-only file that the CLI also skips.
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

# Local-dev RLS compensation: migration 027_comprehensive_rbac.sql dropped the
# catch-all "manage" policy on businesses (and owner-scoped child tables) and
# recreated only SELECT/UPDATE/DELETE, leaving no INSERT policy. On a clean
# database that makes the onboarding flow (createBusinessAction) impossible,
# even though the hosted production database still permits owner inserts. These
# additive INSERT policies restore the original intent for local development.
echo "Applying local-dev owner INSERT policies"
psql "$DB_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
drop policy if exists "Owners can insert their businesses" on public.businesses;
create policy "Owners can insert their businesses"
  on public.businesses for insert
  with check (owner_id = auth.uid());

-- The SELECT policy created by migration 027 uses has_business_role(id, ...),
-- a SECURITY DEFINER function that re-queries public.businesses. During the
-- onboarding INSERT ... RETURNING (PostgREST applies the SELECT policy to the
-- returned row) that re-query cannot see the row being inserted, so the insert
-- fails with an RLS violation. This direct-column policy lets an owner read
-- their own row, including the RETURNING projection.
drop policy if exists "Owners can view own businesses direct" on public.businesses;
create policy "Owners can view own businesses direct"
  on public.businesses for select
  using (owner_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'theme_settings','publishing_settings','payment_settings','page_blocks',
    'menu_categories','menu_items','qr_codes','print_menus'
  ] loop
    execute format('drop policy if exists %I on public.%I',
      'Owners and managers can insert '||t, t);
    execute format($f$create policy %I on public.%I for insert
      with check (public.has_business_role(business_id, array['owner','manager']))$f$,
      'Owners and managers can insert '||t, t);
  end loop;
end $$;
SQL

echo "Local Supabase is ready. Migrations applied."
supabase status
