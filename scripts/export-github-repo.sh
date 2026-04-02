#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_ROOT="${1:-${PLUGIN_ROOT}/dist/github-repo}"
REPO_DIR="${OUTPUT_ROOT}/upwork-autopilot"

rm -rf "${REPO_DIR}"
mkdir -p "${OUTPUT_ROOT}"

rsync -a \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'runs/*.jsonl' \
  --exclude 'config/applicant-profile.local.md' \
  --exclude 'config/search-profile.local.json' \
  --exclude '.DS_Store' \
  "${PLUGIN_ROOT}/" "${REPO_DIR}/"

echo "Exported standalone repo to ${REPO_DIR}"
echo "Next steps:"
echo "1. cd ${REPO_DIR}"
echo "2. bash scripts/validate.sh"
echo "3. Follow docs/PUBLISHING.md"
