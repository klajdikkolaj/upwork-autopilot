#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

TARGET_ROOT="${UPWORK_AUTOPILOT_HOME_ROOT:-$HOME}"
TARGET_PLUGIN_DIR="${TARGET_ROOT}/plugins/upwork-autopilot"
MARKETPLACE_PATH="${TARGET_ROOT}/.agents/plugins/marketplace.json"

mkdir -p "${TARGET_ROOT}/plugins" "$(dirname "${MARKETPLACE_PATH}")"

rsync -a --delete \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'runs/*.jsonl' \
  --exclude 'config/applicant-profile.local.md' \
  --exclude 'config/search-profile.local.json' \
  "${PLUGIN_ROOT}/" "${TARGET_PLUGIN_DIR}/"

python3 - "${MARKETPLACE_PATH}" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
entry = {
    "name": "upwork-autopilot",
    "source": {
        "source": "local",
        "path": "./plugins/upwork-autopilot",
    },
    "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL",
    },
    "category": "Productivity",
}

if path.exists():
    payload = json.loads(path.read_text())
else:
    payload = {
        "name": "local-home-plugins",
        "interface": {"displayName": "Home Plugins"},
        "plugins": [],
    }

plugins = payload.setdefault("plugins", [])
for idx, plugin in enumerate(plugins):
    if isinstance(plugin, dict) and plugin.get("name") == entry["name"]:
        plugins[idx] = entry
        break
else:
    plugins.append(entry)

path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(payload, indent=2) + "\n")
PY

(
  cd "${TARGET_PLUGIN_DIR}"
  npm install
)

echo "Installed upwork-autopilot to ${TARGET_PLUGIN_DIR}"
echo "Marketplace: ${MARKETPLACE_PATH}"
echo "Next steps:"
echo "1. Run node scripts/setup-applicant-profile.mjs"
echo "2. Run bash scripts/launch-controlled-chrome.sh"

if [[ ! -f "${TARGET_PLUGIN_DIR}/config/applicant-profile.local.md" && -t 0 && -t 1 ]]; then
  printf "No local applicant profile found. Run setup wizard now? [Y/n]: "
  read -r answer
  answer="${answer:-Y}"
  if [[ "${answer}" =~ ^([Yy]|[Yy][Ee][Ss])$ ]]; then
    (
      cd "${TARGET_PLUGIN_DIR}"
      node scripts/setup-applicant-profile.mjs
    )
  fi
fi
