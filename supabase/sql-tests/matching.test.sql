-- Testy funkcji łączenia w pary. Uruchamiane przez scripts/test-db.sh
-- na czystym Postgresie z atrapą auth (auth_shim.sql).
\set ON_ERROR_STOP 1
\set QUIET 1

create function pg_temp.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;

insert into auth.users (email, raw_user_meta_data) values
  ('a@test.pl', '{"display_name":"Ania"}'),
  ('b@test.pl', '{"display_name":"Bartek"}'),
  ('c@test.pl', '{"display_name":"Celina"}'),
  ('d@test.pl', '{}'),
  ('e@test.pl', '{"display_name":"Ela"}');
select id as a from auth.users where email = 'a@test.pl' \gset
select id as b from auth.users where email = 'b@test.pl' \gset
select id as c from auth.users where email = 'c@test.pl' \gset
select id as d from auth.users where email = 'd@test.pl' \gset
select id as e from auth.users where email = 'e@test.pl' \gset

select pg_temp.ok((select display_name from profiles where id = :'a') = 'Ania', 'profil tworzony z nazwą z rejestracji');
select pg_temp.ok((select display_name from profiles where id = :'d') = 'Użytkownik', 'zbyt krótka nazwa z e-maila zastąpiona domyślną');

set role authenticated;

-- Natychmiastowe: A czeka 50 min, B czeka 25 min
select set_config('request.jwt.claim.sub', :'a', false);
select pg_temp.ok(instant_join(50, 'praca', 'video', 'Raport') ->> 'status' = 'waiting', 'A czeka w kolejce');
select set_config('request.jwt.claim.sub', :'b', false);
select pg_temp.ok(instant_join(25, 'sprzatanie', 'video') ->> 'status' = 'waiting', 'B (25 min) nie łączy się z A (50 min)');

-- C dołącza na 50 min w trybie audio → para z A
select set_config('request.jwt.claim.sub', :'c', false);
select instant_join(50, 'sprzatanie', 'audio') as r_c \gset
select pg_temp.ok((:'r_c'::jsonb) ->> 'status' = 'matched', 'C dopasowana z oczekującą A');
select (:'r_c'::jsonb) ->> 'session_id' as sid_ac \gset

select set_config('request.jwt.claim.sub', :'a', false);
select pg_temp.ok(instant_poll() ->> 'session_id' = :'sid_ac', 'A odbiera tę samą sesję');
select pg_temp.ok(instant_poll() ->> 'status' = 'none', 'A nie jest już w kolejce');
select pg_temp.ok(get_session(:'sid_ac') ->> 'mode' = 'audio', 'tryb mieszany daje audio');
select pg_temp.ok(get_session(:'sid_ac') -> 'partner' ->> 'name' = 'Celina', 'A widzi nazwę partnerki');
select pg_temp.ok(get_session(:'sid_ac') -> 'me' ->> 'goal' = 'Raport', 'A widzi swój cel');
select pg_temp.ok(get_session(:'sid_ac')::text not like '%@test.pl%', 'e-mail nie wycieka w szczegółach sesji');

select set_config('request.jwt.claim.sub', :'b', false);
select pg_temp.ok(get_session(:'sid_ac') is null, 'obca osoba nie widzi sesji');
select pg_temp.ok((select count(*) from sessions) = 0, 'RLS ukrywa cudze sesje');
select pg_temp.ok(instant_poll() ->> 'status' = 'waiting', 'B nadal czeka');

-- Blokada: D jest zablokowana przez B → nie łączą się
reset role;
insert into blocks (blocker_id, blocked_id) values (:'b', :'d');
set role authenticated;
select set_config('request.jwt.claim.sub', :'d', false);
select pg_temp.ok(instant_join(25, 'nauka', 'video') ->> 'status' = 'waiting', 'zablokowane osoby nie są łączone');

-- E dołącza na 25 → para z B albo D
select set_config('request.jwt.claim.sub', :'e', false);
select pg_temp.ok(instant_join(25, 'ogrod', 'video') ->> 'status' = 'matched', 'E dopasowana z kimś na 25 min');

-- Anulowanie
select set_config('request.jwt.claim.sub', :'b', false);
select instant_leave() as leave_b \gset
select set_config('request.jwt.claim.sub', :'d', false);
select instant_leave() as leave_d \gset
select pg_temp.ok(((:'leave_b'::jsonb) ->> 'status' = 'matched') <> ((:'leave_d'::jsonb) ->> 'status' = 'matched'),
  'dokładnie jedna z osób B/D została dopasowana z E, wyjście zwraca dopasowanie');

-- Wygaśnięcie po 3 min
select set_config('request.jwt.claim.sub', :'a', false);
select instant_join(75, 'inne', 'video');
reset role;
update match_queue set created_at = now() - interval '4 minutes' where user_id = :'a';
set role authenticated;
select pg_temp.ok(instant_poll() ->> 'status' = 'expired', 'po 3 minutach oczekiwanie wygasa');

-- Walidacja parametrów
do $$ begin
  perform instant_join(30, 'praca', 'video');
  raise exception 'FAIL: przyjęto czas 30 min';
exception when sqlstate '22023' then raise notice 'ok - odrzucono niepoprawny czas';
end $$;

-- Rezerwacje
select (date_trunc('hour', now() at time zone 'Europe/Warsaw') + interval '3 hours') at time zone 'Europe/Warsaw' as slot \gset
select (date_trunc('hour', now() at time zone 'Europe/Warsaw') + interval '3 hours 30 minutes') at time zone 'Europe/Warsaw' as slot_half \gset

select set_config('request.jwt.claim.sub', :'a', false);
select book_slot(:'slot', 50, 'praca', 'video') as bk_a \gset
select pg_temp.ok((:'bk_a'::jsonb) ->> 'status' = 'open', 'A rezerwuje slot i czeka na partnera');

select set_config('request.jwt.claim.sub', :'b', false);
select pg_temp.ok((slot_availability(now(), now() + interval '1 day', 50)).waiting = 1, 'B widzi, że ktoś czeka w slocie');
select book_slot(:'slot', 50, 'spacer', 'audio') as bk_b \gset
select pg_temp.ok((:'bk_b'::jsonb) ->> 'status' = 'matched', 'rezerwacja B łączy się z A');
select pg_temp.ok((select partner_name from my_bookings()) = 'Ania', 'B widzi imię partnerki w swoich sesjach');

select set_config('request.jwt.claim.sub', :'a', false);
do $$ begin
  perform book_slot((date_trunc('hour', now() at time zone 'Europe/Warsaw') + interval '3 hours 30 minutes') at time zone 'Europe/Warsaw', 50, 'praca', 'video');
  raise exception 'FAIL: przyjęto nakładającą się rezerwację';
exception when others then
  if sqlerrm <> 'booking_conflict' then raise; end if;
  raise notice 'ok - nakładająca się rezerwacja odrzucona';
end $$;
do $$ begin
  perform book_slot(date_trunc('hour', now()) + interval '2 hours 10 minutes', 25, 'praca', 'video');
  raise exception 'FAIL: przyjęto slot o :10';
exception when sqlstate '22023' then raise notice 'ok - slot spoza siatki :00/:30 odrzucony';
end $$;

select cancel_booking(((:'bk_a'::jsonb) ->> 'booking_id')::uuid) as cancel_a \gset
select pg_temp.ok((:'cancel_a'::jsonb) ->> 'partner_id' = :'b', 'anulowanie zwraca partnera do powiadomienia');

select set_config('request.jwt.claim.sub', :'b', false);
select pg_temp.ok((select status from my_bookings()) = 'open', 'partner wraca do „Czekamy na partnera”');

select set_config('request.jwt.claim.sub', :'c', false);
select pg_temp.ok(book_slot(:'slot', 50, 'nauka', 'video') ->> 'status' = 'matched', 'nowa rezerwacja C łączy się z B');

-- Zgłoszenie tworzy blokadę
select set_config('request.jwt.claim.sub', :'c', false);
select report_partner(:'sid_ac', 'obrazliwe', 'test');
select submit_feedback(:'sid_ac', 'czesciowo');
select pg_temp.ok(get_session(:'sid_ac') ->> 'blocked' = 'true', 'zgłoszenie blokuje partnera');
select pg_temp.ok(get_session(:'sid_ac') ->> 'feedback' = 'czesciowo', 'ocena sesji zapisana');

-- Profil: zmiany tylko dozwolonych kolumn
select set_config('request.jwt.claim.sub', :'a', false);
update profiles set display_name = 'Anna' where id = :'a';
select pg_temp.ok((select display_name from profiles) = 'Anna', 'zmiana nazwy w profilu');
do $$ begin
  update profiles set display_name = 'A';
  raise exception 'FAIL: przyjęto za krótką nazwę';
exception when check_violation then raise notice 'ok - za krótka nazwa odrzucona';
end $$;

-- Usunięcie konta
select set_config('request.jwt.claim.sub', :'e', false);
select delete_my_account();
reset role;
select pg_temp.ok(not exists (select 1 from auth.users where email = 'e@test.pl'), 'konto usunięte');
select pg_temp.ok(not exists (select 1 from profiles where display_name = 'Ela'), 'profil usunięty');

\echo 'Wszystkie testy SQL przeszły'
