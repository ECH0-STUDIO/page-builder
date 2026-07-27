#!/usr/bin/env bash
# Delete GitHub Actions artifacts (and optionally workflow runs) older than N days.
#
# Requires: gh (authenticated as the repo owner), jq, python3
#
# Examples:
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --dry-run
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --days 15 --runs --artifacts
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --runs --no-artifacts
#
# On your Mac/PC (use YOUR GitHub account, not a bot):
#   gh auth login
#   chmod +x scripts/cleanup-github-actions-storage.sh
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --days 15 --runs --artifacts

set -euo pipefail

DAYS=15
DRY_RUN=0
DO_ARTIFACTS=1
DO_RUNS=0
REPO=""

usage() {
  cat <<'EOF'
Usage: cleanup-github-actions-storage.sh OWNER/REPO [options]

Options:
  --days N        Delete items older than N days (default: 15)
  --artifacts     Delete old artifacts (default: on)
  --no-artifacts  Skip artifact deletion
  --runs          Also delete old workflow runs (recommended — frees logs + APKs)
  --dry-run       List what would be deleted, do not delete
  -h, --help      Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days) DAYS="${2:?}"; shift 2 ;;
    --artifacts) DO_ARTIFACTS=1; shift ;;
    --no-artifacts) DO_ARTIFACTS=0; shift ;;
    --runs) DO_RUNS=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$REPO" ]]; then
        echo "Unexpected argument: $1" >&2
        exit 1
      fi
      REPO="$1"
      shift
      ;;
  esac
done

if [[ -z "$REPO" ]]; then
  usage >&2
  exit 1
fi

for cmd in gh jq python3; do
  if ! command -v "$cmd" >/dev/null; then
    echo "$cmd is required." >&2
    exit 1
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login" >&2
  exit 1
fi

CUTOFF_ISO=$(python3 - <<PY
from datetime import datetime, timedelta, timezone
print((datetime.now(timezone.utc) - timedelta(days=int("$DAYS"))).strftime("%Y-%m-%dT%H:%M:%SZ"))
PY
)

echo "Repo:        $REPO"
echo "Cutoff:      older than $DAYS days (before $CUTOFF_ISO)"
echo "Artifacts:   $([[ $DO_ARTIFACTS -eq 1 ]] && echo yes || echo no)"
echo "Runs:        $([[ $DO_RUNS -eq 1 ]] && echo yes || echo no)"
echo "Mode:        $([[ $DRY_RUN -eq 1 ]] && echo DRY-RUN || echo DELETE)"
echo

deleted_artifacts=0
freed_bytes=0
deleted_runs=0

if [[ $DO_ARTIFACTS -eq 1 ]]; then
  echo "==> Collecting artifacts..."
  # gh api --paginate concatenates JSON arrays poorly for this endpoint; page manually.
  page=1
  artifact_rows=()
  while true; do
    payload=$(gh api "repos/$REPO/actions/artifacts?per_page=100&page=$page")
    count=$(echo "$payload" | jq '.artifacts | length')
    [[ "$count" -eq 0 ]] && break

    while IFS=$'\t' read -r id name size created; do
      [[ -z "${id:-}" ]] && continue
      if python3 - "$created" "$CUTOFF_ISO" <<'PY'
import sys
from datetime import datetime
created = datetime.fromisoformat(sys.argv[1].replace("Z", "+00:00"))
cutoff = datetime.fromisoformat(sys.argv[2].replace("Z", "+00:00"))
sys.exit(0 if created < cutoff else 1)
PY
      then
        artifact_rows+=("$id	$name	$size	$created")
      fi
    done < <(echo "$payload" | jq -r '.artifacts[] | [.id, .name, (.size_in_bytes|tostring), .created_at] | @tsv')

    [[ "$count" -lt 100 ]] && break
    page=$((page + 1))
  done

  echo "Artifacts to remove: ${#artifact_rows[@]}"
  for row in "${artifact_rows[@]+"${artifact_rows[@]}"}"; do
    IFS=$'\t' read -r id name size created <<<"$row"
    size_mb=$(python3 -c "print(round($size/1048576, 2))")
    if [[ $DRY_RUN -eq 1 ]]; then
      echo "  [dry-run] artifact #$id  ${size_mb}MB  $created  $name"
    else
      echo "  deleting artifact #$id  ${size_mb}MB  $created  $name"
      gh api -X DELETE "repos/$REPO/actions/artifacts/$id" >/dev/null
    fi
    deleted_artifacts=$((deleted_artifacts + 1))
    freed_bytes=$((freed_bytes + size))
  done
  echo
fi

if [[ $DO_RUNS -eq 1 ]]; then
  echo "==> Collecting workflow runs..."
  page=1
  run_rows=()
  while true; do
    payload=$(gh api "repos/$REPO/actions/runs?per_page=100&page=$page")
    count=$(echo "$payload" | jq '.workflow_runs | length')
    [[ "$count" -eq 0 ]] && break

    while IFS=$'\t' read -r id name created; do
      [[ -z "${id:-}" ]] && continue
      if python3 - "$created" "$CUTOFF_ISO" <<'PY'
import sys
from datetime import datetime
created = datetime.fromisoformat(sys.argv[1].replace("Z", "+00:00"))
cutoff = datetime.fromisoformat(sys.argv[2].replace("Z", "+00:00"))
sys.exit(0 if created < cutoff else 1)
PY
      then
        run_rows+=("$id	$name	$created")
      fi
    done < <(echo "$payload" | jq -r '.workflow_runs[] | [.id, .name, .created_at] | @tsv')

    [[ "$count" -lt 100 ]] && break
    page=$((page + 1))
  done

  echo "Runs to remove: ${#run_rows[@]}"
  for row in "${run_rows[@]+"${run_rows[@]}"}"; do
    IFS=$'\t' read -r id name created <<<"$row"
    if [[ $DRY_RUN -eq 1 ]]; then
      echo "  [dry-run] run #$id  $created  $name"
    else
      echo "  deleting run #$id  $created  $name"
      if ! gh run delete "$id" --repo "$REPO" >/dev/null 2>&1; then
        gh api -X DELETE "repos/$REPO/actions/runs/$id" >/dev/null
      fi
      sleep 0.15
    fi
    deleted_runs=$((deleted_runs + 1))
  done
  echo
fi

freed_mb=$(python3 -c "print(round($freed_bytes/1048576, 2))")
echo "Done."
echo "  Artifacts: $deleted_artifacts (~${freed_mb} MB reported artifact size)"
echo "  Runs:      $deleted_runs"
if [[ $DRY_RUN -eq 1 ]]; then
  echo "Dry-run only — re-run without --dry-run to delete."
else
  echo "Billing → Usage can take a few hours to reflect freed storage."
fi
