#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

VERSION="$(python3 - <<PY
import json
from pathlib import Path
print(json.loads(Path(r"${PLUGIN_ROOT}/package.json").read_text())["version"])
PY
)"
OUTPUT_DIR="${1:-${PLUGIN_ROOT}/dist}"
ARCHIVE_PATH="${OUTPUT_DIR}/upwork-autopilot-${VERSION}.zip"

mkdir -p "${OUTPUT_DIR}"
rm -f "${ARCHIVE_PATH}"

PARENT_DIR="$(cd "${PLUGIN_ROOT}/.." && pwd)"
PLUGIN_NAME="$(basename "${PLUGIN_ROOT}")"

(
  cd "${PARENT_DIR}"
  zip -rq "${ARCHIVE_PATH}" "${PLUGIN_NAME}" \
    -x "${PLUGIN_NAME}/node_modules/*" \
    -x "${PLUGIN_NAME}/dist/*" \
    -x "${PLUGIN_NAME}/runs/*.jsonl" \
    -x "${PLUGIN_NAME}/config/applicant-profile.local.md" \
    -x "${PLUGIN_NAME}/config/search-profile.local.json" \
    -x "${PLUGIN_NAME}/.DS_Store"
)

if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "${ARCHIVE_PATH}"
elif command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${ARCHIVE_PATH}"
else
  echo "Archive created at ${ARCHIVE_PATH}"
  echo "Checksum skipped: neither shasum nor sha256sum is available."
fi
