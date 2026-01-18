#!/usr/bin/env bash
set -euo pipefail

build_psql_cmd() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    PSQL_CMD=(psql -v ON_ERROR_STOP=1 "$DATABASE_URL")
  else
    PSQL_CMD=(
      psql
      -v ON_ERROR_STOP=1
      --host="${PGHOST:-localhost}"
      --port="${PGPORT:-5432}"
      --username="${PGUSER:-pcrm}"
      --dbname="${PGDATABASE:-pcrm}"
    )
  fi
}
