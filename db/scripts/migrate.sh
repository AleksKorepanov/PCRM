#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/../migrations"

# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

build_psql_cmd

for migration in "${MIGRATIONS_DIR}"/*.sql; do
  echo "Applying ${migration}"
  "${PSQL_CMD[@]}" -f "${migration}"
done
