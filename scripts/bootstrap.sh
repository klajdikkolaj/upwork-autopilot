#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NPM_BIN="${NPM_BIN:-}"
NODE_BIN="${NODE_BIN:-}"

cd "${PLUGIN_ROOT}"

if [[ -d node_modules/playwright-core ]]; then
  echo "playwright-core already installed"
  exit 0
fi

if [[ -z "${NPM_BIN}" ]]; then
  NPM_BIN="$(command -v npm || true)"
fi

if [[ -z "${NPM_BIN}" && -x /opt/homebrew/bin/npm ]]; then
  NPM_BIN="/opt/homebrew/bin/npm"
fi

if [[ -z "${NODE_BIN}" ]]; then
  NODE_BIN="$(command -v node || true)"
fi

if [[ -z "${NODE_BIN}" && -x /opt/homebrew/bin/node ]]; then
  NODE_BIN="/opt/homebrew/bin/node"
fi

if [[ -n "${NODE_BIN}" ]]; then
  export PATH="$(dirname "${NODE_BIN}"):${PATH}"
fi

if [[ -z "${NPM_BIN}" ]]; then
  echo "Bootstrap requires npm on PATH." >&2
  exit 1
fi

"${NPM_BIN}" install
