#!/usr/bin/env bash
# Dwie osoby jednocześnie dołączają z lobby do tej samej osoby: wygrywa dokładnie jedna.
set -euo pipefail
DB="$1"
PSQL=(psql -X -q -t -A -v ON_ERROR_STOP=1 -d "$DB")
"${PSQL[@]}" -c "delete from match_queue"
host=$("${PSQL[@]}" -c "insert into auth.users (email) values ('lhost-$RANDOM@test.pl') returning id" | head -1)
g1=$("${PSQL[@]}" -c "insert into auth.users (email) values ('lg1-$RANDOM@test.pl') returning id" | head -1)
g2=$("${PSQL[@]}" -c "insert into auth.users (email) values ('lg2-$RANDOM@test.pl') returning id" | head -1)
"${PSQL[@]}" -c "set role authenticated; select set_config('request.jwt.claim.sub', '$host', false); select instant_join(25, 'praca', 'video');" >/dev/null
ticket=$("${PSQL[@]}" -c "select ticket from match_queue where user_id = '$host'")
for g in "$g1" "$g2"; do
  "${PSQL[@]}" -c "set role authenticated; select set_config('request.jwt.claim.sub', '$g', false); select instant_join_ticket('$ticket', 'nauka') ->> 'status';" > "/tmp/lobby-race-$g" &
done
wait
won=$(cat /tmp/lobby-race-"$g1" /tmp/lobby-race-"$g2" | grep -c matched || true)
sessions=$("${PSQL[@]}" -c "select count(*) from sessions where user_a = '$host'")
rm -f /tmp/lobby-race-"$g1" /tmp/lobby-race-"$g2"
if [[ "$won" == "1" && "$sessions" == "1" ]]; then
  echo "ok - dwóch gości naraz: dołącza dokładnie jeden"
else
  echo "FAIL: matched=$won, sesje=$sessions" >&2
  exit 1
fi
