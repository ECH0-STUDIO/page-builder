#!/usr/bin/env bash
# One-time base setup for the Cloud Agent environment (runs in `install`).
#
# Installs system dependencies (Docker + fuse-overlayfs + psql), the Supabase
# CLI, and JS dependencies, generates the local .env.local, and warms the
# Supabase Docker images / schema so they are captured in the environment
# snapshot. Idempotent: safe to run repeatedly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_CLI_VERSION="2.117.0"

echo "==> System packages (docker, fuse-overlayfs, postgresql-client)"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  -o Dpkg::Options::="--force-confold" \
  docker.io fuse-overlayfs postgresql-client

echo "==> Use legacy iptables (Docker networking is broken with nftables in the nested VM)"
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy

echo "==> Docker daemon config"
sudo mkdir -p /etc/docker
echo '{"storage-driver":"fuse-overlayfs","firewall-backend":"iptables"}' \
  | sudo tee /etc/docker/daemon.json >/dev/null

echo "==> Supabase CLI ${SUPABASE_CLI_VERSION}"
if ! command -v supabase >/dev/null 2>&1; then
  curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}/supabase_linux_amd64.tar.gz" \
    | sudo tar -xz -C /usr/local/bin supabase
fi
supabase --version

echo "==> JS dependencies"
corepack enable
cd "$ROOT"
pnpm install --frozen-lockfile

echo "==> Local web env file"
"$ROOT/scripts/write-local-env.sh"

echo "==> Warm Supabase images + schema (captured in the snapshot)"
"$ROOT/scripts/start-docker.sh"
"$ROOT/scripts/local-supabase.sh"

echo "Install complete."
