#!/usr/bin/env bash
# Trzy osoby jednocześnie dołączają do kolejki na ten sam czas:
# dokładnie dwie mają zostać połączone, trzecia czeka.
set -euo pipefail
DB="$1"
PSQL=(psql -X -q -t -A -v ON_ERROR_STOP=1 -d "$DB")

"${PSQL[@]}" -c "delete from match_queue where duration = 75"
ids=()
for i in 1 2 3; do
  ids+=("$("${PSQL[@]}" -c "insert into auth.users (email) values ('race$i-$RANDOM@test.pl') returning id" | head -1)")
done

for id in "${ids[@]}"; do
  "${PSQL[@]}" -c "set role authenticated; select set_config('request.jwt.claim.sub', '$id', false); select instant_join(75, 'praca', 'video');" >/dev/null &
done
wait

# Każdy dopytuje o wynik (dopasowanie może nastąpić przy odpytaniu).
for _ in 1 2; do
  for id in "${ids[@]}"; do
    "${PSQL[@]}" -c "set role authenticated; select set_config('request.jwt.claim.sub', '$id', false); select instant_poll() ->> 'status';" >/dev/null
  done
done

sessions=$("${PSQL[@]}" -c "select count(*) from sessions where duration = 75 and (user_a = any(array['${ids[0]}','${ids[1]}','${ids[2]}']::uuid[]) or user_b = any(array['${ids[0]}','${ids[1]}','${ids[2]}']::uuid[]))")
waiting=$("${PSQL[@]}" -c "select count(*) from match_queue where session_id is null and user_id = any(array['${ids[0]}','${ids[1]}','${ids[2]}']::uuid[])")

if [[ "$sessions" == "1" && "$waiting" == "1" ]]; then
  echo "ok - równoczesne dołączenie: 1 sesja, 1 osoba czeka"
else
  echo "FAIL: sesje=$sessions, czekający=$waiting" >&2
  exit 1
fi
