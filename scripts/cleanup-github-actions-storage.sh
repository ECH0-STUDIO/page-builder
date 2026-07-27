#!/usr/bin/env bash
# Delete GitHub Actions artifacts (and optionally workflow runs) older than N days.
#
# Requires: gh (authenticated), jq, python3
#
# Examples:
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --days 15 --dry-run
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --runs
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --artifacts --runs
#
# Run this on your machine with YOUR GitHub login:
#   gh auth login
#   chmod +x scripts/cleanup-github-actions-storage.sh
#   ./scripts/cleanup-github-actions-storage.sh ECHO-STUDIO/pinit --runs --artifacts

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
  --runs          Also delete old workflow runs (frees logs + attached artifacts)
  --dry-run       List what would be deleted, do not delete
  -h, --help      Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days)
      DAYS="${2:?}"
      shift 2
      ;;
    --artifacts)
      DO_ARTIFACTS=1
      shift
      ;;
    --no-artifacts)
      DO_ARTIFACTS=0
      shift
      ;;
    --runs)
      DO_RUNS=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
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

if ! command -v gh >/dev/null; then
  echo "gh CLI is required. Install: https://cli.github.com/" >&2
  exit 1
fi
if ! command -v jq >/dev/null; then
  echo "jq is required." >&2
  exit 1
fi
if ! command -v python3 >/dev/null; then
  echo "python3 is required." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login" >&2
  exit 1
fi

CUTOFF_EPOCH=$(python3 - <<PY
from datetime import datetime, timedelta, timezone
print(int((datetime.now(timezone.utc) - timedelta(days=int("$DAYS"))).timestamp()))
PY
)

echo "Repo:        $REPO"
echo "Older than:  $DAYS days (before $(python3 -c "from datetime import datetime,timezone; print(datetime.fromtimestamp($CUTOFF_EPOCH, tz=timezone.utc).isoformat())"))"
echo "Artifacts:   $([[ $DO_ARTIFACTS -eq 1 ]] && echo yes || echo no)"
echo "Runs:        $([[ $DO_RUNS -eq 1 ]] && echo yes || echo no)"
echo "Mode:        $([[ $DRY_RUN -eq 1 ]] && echo DRY-RUN || echo DELETE)"
echo

deleted_artifacts=0
freed_bytes=0
deleted_runs=0

if [[ $DO_ARTIFACTS -eq 1 ]]; then
  echo "==> Scanning artifacts..."
  page=1
  while true; do
    payload=$(gh api "repos/$REPO/actions/artifacts?per_page=100&page=$page")
    count=$(echo "$payload" | jq '.artifacts | length')
    if [[ "$count" -eq 0 ]]; then
      break
    fi

    while IFS=$'\t' read -r id name size created; do
      [[ -z "$id" ]] && continue
      created_epoch=$(python3 -c "from datetime import datetime; print(int(datetime.fromisoformat('$created'.replace('Z','+00:00')).timestamp()))")
      if (( created_epoch >= CUTOFF_EPOCH )); then
        continue
      fi
      size_mb=$(python3 -c "print(round($size/1048576, 2))")
      if [[ $DRY_RUN -eq 1 ]]; then
        echo "  [dry-run] artifact #$id  ${size_mb}MB  $created  $name"
      else
        echo "  deleting artifact #$id  ${size_mb}MB  $created  $name"
        gh api -X DELETE "repos/$REPO/actions/artifacts/$id" >/dev/null
      fi
      deleted_artifacts=$((deleted_artifacts + 1))
      freed_bytes=$((freed_bytes + size))
    done < <(echo "$payload" | jq -r '.artifacts[] | [.id, .name, (.size_in_bytes|tostring), .created_at] | @tsv')

    if [[ "$count" -lt 100 ]]; then
      break
    fi
    page=$((page + 1))
  done
  echo "Artifacts matched: $deleted_artifacts"
  echo
fi

if [[ $DO_RUNS -eq 1 ]]; then
  echo "==> Scanning workflow runs..."
  page=1
  while true; do
    payload=$(gh api "repos/$REPO/actions/runs?per_page=100&page=$page")
    count=$(echo "$payload" | jq '.workflow_runs | length')
    if [[ "$count" -eq 0 ]]; then
      break
    fi

    while IFS=$'\t' read -r id name created; do
      [[ -z "$id" ]] && continue
      created_epoch=$(python3 -c "from datetime import datetime; print(int(datetime.fromisoformat('$created'.replace('Z','+00:00')).timestamp()))")
      if (( created_epoch >= CUTOFF_EPOCH )); then
        continue
      fi
      if [[ $DRY_RUN -eq 1 ]]; then
        echo "  [dry-run] run #$id  $created  $name"
      else
        echo "  deleting run #$id  $created  $name"
        # Prefer gh CLI helper when available
        if gh run delete "$id" --repo "$REPO" >/dev/null 2>&1; then
          :
        else
          gh api -X DELETE "repos/$REPO/actions/runs/$id" >/dev/null
        fi
      fi
      deleted_runs=$((deleted_runs + 1))
      # Be nice to API rate limits
      sleep 0.2
    done < <(echo "$payload" | jq -r '.workflow_runs[] | [.id, .name, .created_at] | @tsv')

    # Important: after deletions, pages shift. Always restart from page 1 when deleting.
    if [[ $DRY_RUN -eq 0 && $deleted_runs -gt 0 ]]; then
      # Re-scan from start until a full page has nothing old left... simpler: keep page=1
      # but break when this page had no old items and next would be needed.
      :
    fi

    if [[ "$count" -lt 100 ]]; then
      break
    fi
    # When deleting, re-fetch page 1 because items disappear and shift
    if [[ $DRY_RUN -eq 0 ]]; then
      page=1
    else
      page=$((page + 1))
    fi
  done
  echo "Runs matched: $deleted_runs"
  echo
fi

freed_mb=$(python3 -c "print(round($freed_bytes/1048576, 2))")
echo "Done."
echo "  Artifacts: $deleted_artifacts (~${freed_mb} MB from artifact sizes)"
echo "  Runs:      $deleted_runs"
if [[ $DRY_RUN -eq 1 ]]; then
  echo "Dry-run only — re-run without --dry-run to delete."
else
  echo "Storage may take a few hours to update in Billing → Usage."
fi
