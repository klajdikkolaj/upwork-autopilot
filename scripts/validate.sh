#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILL_VALIDATOR="${HOME}/.codex/skills/.system/skill-creator/scripts/quick_validate.py"
NODE_BIN="${NODE_BIN:-}"
NPM_BIN="${NPM_BIN:-}"

cd "${PLUGIN_ROOT}"

if [[ -z "${NODE_BIN}" ]]; then
  NODE_BIN="$(command -v node || true)"
fi

if [[ -z "${NODE_BIN}" && -x /opt/homebrew/bin/node ]]; then
  NODE_BIN="/opt/homebrew/bin/node"
fi

if [[ -z "${NODE_BIN}" ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "Validation requires Node.js or npm on PATH." >&2
    exit 1
  fi
  NODE_BIN="$(npm exec -- node -p 'process.execPath')"
fi

if [[ -z "${NPM_BIN}" ]]; then
  NPM_BIN="$(command -v npm || true)"
fi

if [[ -z "${NPM_BIN}" && -x /opt/homebrew/bin/npm ]]; then
  NPM_BIN="/opt/homebrew/bin/npm"
fi

while IFS= read -r file; do
  bash -n "${file}"
done < <(find scripts -type f -name '*.sh' | LC_ALL=C sort)

while IFS= read -r file; do
  "${NODE_BIN}" --check "${file}"
done < <(find bin scripts -type f -name '*.mjs' | LC_ALL=C sort)

if [[ -f Formula/upwork-autopilot.rb ]]; then
  ruby -c Formula/upwork-autopilot.rb >/dev/null
fi

if [[ -n "${NPM_BIN}" ]]; then
  "${NPM_BIN}" pack --dry-run >/dev/null
  "${NODE_BIN}" scripts/update-homebrew-formula.mjs --check
else
  echo "Skipping npm package validation: npm not found"
fi

if [[ -f "${SKILL_VALIDATOR}" ]]; then
  if python3 -c 'import yaml' >/dev/null 2>&1; then
    python3 "${SKILL_VALIDATOR}" "${PLUGIN_ROOT}/skills/upwork-application-session"
  else
    echo "Skipping Codex skill validation: python3 module 'yaml' is unavailable"
  fi
else
  echo "Skipping Codex skill validation: ${SKILL_VALIDATOR} not found"
fi

echo "Validation passed."
