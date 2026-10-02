#!/usr/bin/env bash
# Wgrywa migracje z supabase/migrations do bazy wskazanej przez SUPABASE_DB_URL.
# Na Railway uruchamiane jako preDeployCommand – błąd przerywa wdrożenie,
# a poprzednia wersja aplikacji działa dalej.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL nie jest ustawiony – pomijam migracje bazy."
  exit 0
fi

npx --yes supabase@2.119.0 db push --db-url "$SUPABASE_DB_URL" --include-all --yes
