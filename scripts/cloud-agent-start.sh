#!/usr/bin/env bash
# Per-boot startup for the Cloud Agent environment (runs in `start`).
# Starts the Docker daemon and the local Supabase stack, and ensures the local
# web env file exists. The dev server itself is run as a `terminals` process
# (scripts/dev-web.sh). Idempotent.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$ROOT/scripts/start-docker.sh"
"$ROOT/scripts/write-local-env.sh"
"$ROOT/scripts/local-supabase.sh"

echo "Environment ready: Supabase local stack is up."
