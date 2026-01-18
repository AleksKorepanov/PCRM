#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

build_psql_cmd

"${PSQL_CMD[@]}" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

bash "${SCRIPT_DIR}/migrate.sh"
bash "${SCRIPT_DIR}/seed.sh"
