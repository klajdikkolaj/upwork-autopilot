#!/usr/bin/env bash
set -euo pipefail

PORT="${UPWORK_AUTOPILOT_PORT:-9225}"
START_URL="${UPWORK_AUTOPILOT_START_URL:-https://www.upwork.com/nx/find-work/best-matches}"
CHROME_APP="${UPWORK_AUTOPILOT_CHROME_APP:-Google Chrome}"
CHROME_MODE="${UPWORK_AUTOPILOT_CHROME_MODE:-isolated}"
ISOLATED_PROFILE_DIR="${UPWORK_AUTOPILOT_PROFILE_DIR:-$HOME/.codex/upwork-autopilot/chrome-profile}"
SYSTEM_USER_DATA_DIR="${UPWORK_AUTOPILOT_SYSTEM_USER_DATA_DIR:-$HOME/Library/Application Support/Google/Chrome}"
SYSTEM_PROFILE_DIRECTORY="${UPWORK_AUTOPILOT_SYSTEM_PROFILE_DIRECTORY:-Default}"
CLOSE_EXISTING_CHROME="${UPWORK_AUTOPILOT_CLOSE_EXISTING_CHROME:-0}"

chrome_running() {
  osascript -e "application \"${CHROME_APP}\" is running" 2>/dev/null | grep -qi '^true$'
}

quit_chrome() {
  osascript -e "tell application \"${CHROME_APP}\" to quit" >/dev/null 2>&1 || true
  for _ in {1..30}; do
    if ! chrome_running; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for ${CHROME_APP} to quit." >&2
  exit 1
}

wait_for_cdp() {
  for _ in {1..30}; do
    if curl -sf "http://127.0.0.1:${PORT}/json/version" >/dev/null; then
      echo "Chrome CDP ready on port ${PORT}"
      echo "Mode: ${CHROME_MODE}"
      case "${CHROME_MODE}" in
        isolated)
          echo "Profile: ${ISOLATED_PROFILE_DIR}"
          ;;
        system-profile)
          echo "User data dir: ${SYSTEM_USER_DATA_DIR}"
          echo "Profile directory: ${SYSTEM_PROFILE_DIRECTORY}"
          ;;
        attach)
          echo "CDP URL: http://127.0.0.1:${PORT}"
          ;;
      esac
      echo "Start URL: ${START_URL}"
      exit 0
    fi
    sleep 1
  done

  echo "Chrome opened, but the CDP endpoint did not become ready on port ${PORT}" >&2
  exit 1
}

launch_isolated() {
  mkdir -p "${ISOLATED_PROFILE_DIR}"

  open -na "${CHROME_APP}" --args \
    --user-data-dir="${ISOLATED_PROFILE_DIR}" \
    --remote-debugging-port="${PORT}" \
    --no-first-run \
    --no-default-browser-check \
    "${START_URL}"
}

launch_system_profile() {
  if [[ ! -d "${SYSTEM_USER_DATA_DIR}" ]]; then
    echo "Chrome user data directory not found: ${SYSTEM_USER_DATA_DIR}" >&2
    exit 1
  fi

  if chrome_running; then
    if [[ "${CLOSE_EXISTING_CHROME}" != "1" ]]; then
      echo "${CHROME_APP} is already running." >&2
      echo "To reuse your logged-in profile, close Chrome first or re-run with UPWORK_AUTOPILOT_CLOSE_EXISTING_CHROME=1." >&2
      exit 1
    fi

    echo "Closing ${CHROME_APP} so the logged-in profile can be relaunched with CDP..."
    quit_chrome
  fi

  open -na "${CHROME_APP}" --args \
    --user-data-dir="${SYSTEM_USER_DATA_DIR}" \
    --profile-directory="${SYSTEM_PROFILE_DIRECTORY}" \
    --remote-debugging-port="${PORT}" \
    --no-first-run \
    --no-default-browser-check \
    "${START_URL}"
}

case "${CHROME_MODE}" in
  isolated)
    launch_isolated
    ;;
  system-profile)
    launch_system_profile
    ;;
  attach)
    echo "Attach mode: expecting an existing Chrome CDP endpoint on port ${PORT}"
    ;;
  *)
    echo "Unsupported UPWORK_AUTOPILOT_CHROME_MODE: ${CHROME_MODE}" >&2
    echo "Expected one of: isolated, system-profile, attach" >&2
    exit 1
    ;;
esac

wait_for_cdp
