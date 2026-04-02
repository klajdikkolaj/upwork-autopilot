#!/usr/bin/env bash
set -euo pipefail

PORT="${UPWORK_AUTOPILOT_PORT:-9225}"
PROFILE_DIR="${UPWORK_AUTOPILOT_PROFILE_DIR:-$HOME/.codex/upwork-autopilot/chrome-profile}"
START_URL="${UPWORK_AUTOPILOT_START_URL:-https://www.upwork.com/nx/find-work/best-matches}"
CHROME_APP="${UPWORK_AUTOPILOT_CHROME_APP:-Google Chrome}"

mkdir -p "${PROFILE_DIR}"

open -na "${CHROME_APP}" --args \
  --user-data-dir="${PROFILE_DIR}" \
  --remote-debugging-port="${PORT}" \
  --no-first-run \
  --no-default-browser-check \
  "${START_URL}"

for _ in {1..30}; do
  if curl -sf "http://127.0.0.1:${PORT}/json/version" >/dev/null; then
    echo "Chrome CDP ready on port ${PORT}"
    echo "Profile: ${PROFILE_DIR}"
    echo "Start URL: ${START_URL}"
    exit 0
  fi
  sleep 1
done

echo "Chrome opened, but the CDP endpoint did not become ready on port ${PORT}" >&2
exit 1
