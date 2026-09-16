#!/usr/bin/env bash
# Start the Docker daemon inside the Cloud Agent VM (idempotent).
# There is no init system, so dockerd is launched directly. Uses fuse-overlayfs
# and the legacy-iptables firewall backend (configured in /etc/docker/daemon.json)
# because nftables rule programming fails in the nested VM and breaks container
# networking.
set -euo pipefail

if sudo docker info >/dev/null 2>&1; then
  sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
  echo "Docker daemon already running."
  exit 0
fi

echo "Starting dockerd..."
sudo bash -c 'nohup dockerd >/tmp/dockerd.log 2>&1 &'

for i in $(seq 1 30); do
  if sudo docker info >/dev/null 2>&1; then
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    echo "Docker daemon is up."
    exit 0
  fi
  sleep 1
done

echo "ERROR: dockerd did not become ready in time. Last log lines:" >&2
tail -n 20 /tmp/dockerd.log >&2 || true
exit 1
