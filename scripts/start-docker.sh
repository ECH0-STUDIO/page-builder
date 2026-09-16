#!/usr/bin/env bash
# Start the Docker daemon inside the Cloud Agent VM (idempotent).
# There is no init system, so dockerd is launched directly. Uses fuse-overlayfs
# and the legacy-iptables firewall backend (configured in /etc/docker/daemon.json)
# because nftables rule programming fails in the nested VM and breaks container
# networking.
set -euo pipefail

LOG=/var/log/cursor-dockerd.log

if sudo docker info >/dev/null 2>&1; then
  sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
  echo "Docker daemon already running."
  exit 0
fi

echo "Starting dockerd (log: $LOG)..."
sudo rm -f "$LOG" 2>/dev/null || true
sudo bash -c "nohup dockerd >>'$LOG' 2>&1 &"

# dockerd can take a while on first boot from a snapshot while it restores any
# previously-created containers/networks, so allow generous time.
for i in $(seq 1 90); do
  if sudo docker info >/dev/null 2>&1; then
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    echo "Docker daemon is up after ${i}s."
    exit 0
  fi
  sleep 1
done

echo "ERROR: dockerd did not become ready in time. Last log lines:" >&2
sudo tail -n 30 "$LOG" >&2 2>/dev/null || true
exit 1
