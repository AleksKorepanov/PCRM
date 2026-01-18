#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="${SCRIPT_DIR}/../seeds/seed.sql"

# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

build_psql_cmd

"${PSQL_CMD[@]}" -f "${SEED_FILE}"
