#!/usr/bin/env bash
# Run the Next.js web app locally against the local Supabase stack.
#
# Why this wrapper exists:
# The app has two sibling dynamic route segments at the App Router root,
# `src/app/[locale]/[slug]` and `src/app/[slug]`. Vercel/OpenNext route these
# by their build manifest, so production works. Next.js's own self-hosted server
# (`next dev` and `next start`, both Turbopack and webpack) instead builds a
# single in-memory route tree and refuses two differently-named dynamic segments
# at the same path position, crashing every request with:
#   "You cannot use different slug names for the same dynamic path
#    ('locale' !== 'slug')"
#
# `next build` succeeds (both routes appear in the manifest); only the local HTTP
# server is affected. To make local development possible, this script relocates
# the locale-prefixed storefront variant (`[locale]`) out of the tree while the
# dev server runs and restores it on exit. The locale-prefixed public storefront
# path (e.g. /en/{slug}) is therefore unavailable in local dev; every other route
# (marketing, auth, dashboard/page-builder, and the default /{slug} storefront)
# works normally.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCALE_DIR="$ROOT/apps/web/src/app/[locale]"
STASH_DIR="$ROOT/.dev-route-stash"

restore() {
  if [ -d "$STASH_DIR/[locale]" ]; then
    rm -rf "$LOCALE_DIR"
    mv "$STASH_DIR/[locale]" "$LOCALE_DIR"
    rmdir "$STASH_DIR" 2>/dev/null || true
    echo "Restored [locale] route."
  fi
}
trap restore EXIT

if [ -d "$LOCALE_DIR" ]; then
  mkdir -p "$STASH_DIR"
  mv "$LOCALE_DIR" "$STASH_DIR/[locale]"
  echo "Relocated [locale] route for local dev (restored on exit)."
fi

cd "$ROOT/apps/web"
exec npx next dev -H 0.0.0.0 "$@"
