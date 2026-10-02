#!/usr/bin/env bash
# Uruchamia migracje i testy SQL na lokalnym Postgresie (bez Dockera/Supabase).
# Użycie: scripts/test-db.sh   (wymaga psql z dostępem superużytkownika,
# np. PGUSER=postgres albo uruchomienia jako użytkownik postgres)
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${TEST_DB:-adehadziaki_test}"

psql -X -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/sql-tests/auth_shim.sql
for f in supabase/migrations/*.sql; do
  psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f"
done
psql -X -v ON_ERROR_STOP=1 -d "$DB" -f supabase/sql-tests/matching.test.sql 2>&1 | sed -n 's/.*NOTICE:  //p; /FAIL\|ERROR\|przeszły/p'
bash supabase/sql-tests/concurrency.sh "$DB"
bash supabase/sql-tests/lobby-race.sh "$DB"
