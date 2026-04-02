#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PLUGIN_ROOT}"

if [[ -d node_modules/playwright-core ]]; then
  echo "playwright-core already installed"
  exit 0
fi

npm install
