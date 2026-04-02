#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export UPWORK_AUTOPILOT_CHROME_MODE="isolated"
export UPWORK_AUTOPILOT_CLOSE_EXISTING_CHROME="${UPWORK_AUTOPILOT_CLOSE_EXISTING_CHROME:-0}"

exec "${SCRIPT_DIR}/launch-controlled-chrome.sh"
