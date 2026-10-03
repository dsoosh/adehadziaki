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

-- Zgoda dla kont z Google (bez accepted_terms_at w metadanych)
select set_config('request.jwt.claim.sub', :'d', false);
select pg_temp.ok((select accepted_terms_at from profiles) is null, 'konto bez zgody ma pustą datę akceptacji');
do $$ begin
  perform accept_terms('X');
  raise exception 'FAIL: przyjęto za krótką nazwę w accept_terms';
exception when sqlstate '22023' then raise notice 'ok - accept_terms odrzuca za krótką nazwę';
end $$;
select accept_terms('  Dorota ');
select pg_temp.ok((select accepted_terms_at is not null and display_name = 'Dorota' from profiles), 'accept_terms zapisuje zgodę i nazwę');
do $$ begin
  update profiles set accepted_terms_at = null;
  raise exception 'FAIL: użytkownik może sam zmienić datę zgody';
exception when insufficient_privilege then raise notice 'ok - datę zgody zmienia tylko accept_terms';
end $$;

-- Konta bez profilu (sprzed migracji init) i nazwy z zapasem
reset role;
alter table auth.users disable trigger on_auth_user_created;
insert into auth.users (email, raw_user_meta_data) values ('stary@test.pl', '{"full_name":"Stefan Stary"}');
alter table auth.users enable trigger on_auth_user_created;
select id as old from auth.users where email = 'stary@test.pl' \gset
select pg_temp.ok(not exists (select 1 from profiles where id = :'old'), 'konto sprzed migracji nie ma profilu');
select pg_temp.ok(backfill_profiles() = 1, 'backfill zakłada brakujący profil');
select pg_temp.ok((select display_name = 'Stefan Stary' and accepted_terms_at is null from profiles where id = :'old'),
  'backfill bierze nazwę z metadanych i wymaga zgody');
delete from profiles where id = :'old';
set role authenticated;
select set_config('request.jwt.claim.sub', :'old', false);
select accept_terms('Stefan');
select pg_temp.ok((select display_name = 'Stefan' and accepted_terms_at is not null from profiles), 'accept_terms zakłada brakujący profil');

reset role;
delete from profiles where id = :'c';
set role authenticated;
select set_config('request.jwt.claim.sub', :'a', false);
select pg_temp.ok(get_session(:'sid_ac') -> 'partner' ->> 'name' = 'Partner', 'brak profilu partnera daje nazwę „Partner”');
reset role;
insert into profiles (id, display_name, accepted_terms_at) values (:'c', 'Celina', now());
set role authenticated;

-- Lobby i skrócone nazwy
reset role;
select pg_temp.ok(short_name('Anna Maria Kowalska') = 'Anna K.', 'short_name: imię + inicjał nazwiska');
select pg_temp.ok(short_name('  Ania ') = 'Ania', 'short_name: jedno słowo bez zmian');
select pg_temp.ok(short_name('') = 'Partner' and short_name(null) = 'Partner', 'short_name: pusta nazwa');
delete from match_queue;
insert into auth.users (email, raw_user_meta_data) values
  ('host@test.pl', '{"display_name":"Anna Maria Kowalska","accepted_terms_at":"2026-01-01T00:00:00Z"}'),
  ('gosc1@test.pl', '{"display_name":"Gość Pierwszy"}'),
  ('gosc2@test.pl', '{"display_name":"Gość Drugi"}');
select id as host from auth.users where email = 'host@test.pl' \gset
select id as g1 from auth.users where email = 'gosc1@test.pl' \gset
select id as g2 from auth.users where email = 'gosc2@test.pl' \gset
set role authenticated;

select set_config('request.jwt.claim.sub', :'host', false);
select instant_join(25, 'sprzatanie', 'audio', 'Tajny cel');
select pg_temp.ok(jsonb_array_length(lobby() -> 'now') = 0, 'lobby nie pokazuje mnie samej');

select set_config('request.jwt.claim.sub', :'g1', false);
select lobby() -> 'now' -> 0 as entry \gset
select pg_temp.ok((:'entry'::jsonb) ->> 'name' = 'Anna K.', 'lobby pokazuje imię + inicjał');
select pg_temp.ok((:'entry'::jsonb) ->> 'activity' = 'sprzatanie' and (:'entry'::jsonb) ->> 'duration' = '25', 'lobby pokazuje czynność i czas');
select pg_temp.ok(:'entry' not like '%Tajny%' and :'entry' not like '%Kowalska%' and (:'entry'::jsonb) ->> 'user_id' is null,
  'lobby nie ujawnia celu, pełnej nazwy ani user_id');
select (:'entry'::jsonb) ->> 'ticket' as ticket \gset

select instant_join_ticket(:'ticket', 'praca') as joined \gset
select pg_temp.ok((:'joined'::jsonb) ->> 'status' = 'matched', 'gość dołącza do wybranej osoby');
select (:'joined'::jsonb) ->> 'session_id' as sid_lobby \gset
select pg_temp.ok(get_session(:'sid_lobby') ->> 'mode' = 'audio' and get_session(:'sid_lobby') ->> 'duration' = '25',
  'czas i tryb od gospodarza');
select pg_temp.ok(get_session(:'sid_lobby') -> 'partner' ->> 'name' = 'Anna K.', 'gość widzi skróconą nazwę gospodarza');
select pg_temp.ok(get_session(:'sid_lobby') -> 'partner' ->> 'goal' = 'Tajny cel', 'cel widać dopiero po połączeniu');

select set_config('request.jwt.claim.sub', :'host', false);
select pg_temp.ok(instant_poll() ->> 'session_id' = :'sid_lobby', 'gospodarz trafia do tej samej sesji');
select pg_temp.ok(get_session(:'sid_lobby') -> 'me' ->> 'name' = 'Anna Maria Kowalska', 'własna nazwa jest pełna');

select set_config('request.jwt.claim.sub', :'g2', false);
select pg_temp.ok(instant_join_ticket(:'ticket', 'nauka') ->> 'status' = 'gone', 'zajęty wpis daje gone');

-- Blokada ukrywa wpis w lobby
select set_config('request.jwt.claim.sub', :'host', false);
select instant_join(50, 'praca', 'video');
reset role;
insert into blocks (blocker_id, blocked_id) values (:'host', :'g2');
set role authenticated;
select set_config('request.jwt.claim.sub', :'g2', false);
select pg_temp.ok(jsonb_array_length(lobby() -> 'now') = 0, 'zablokowana osoba nie widzi wpisu w lobby');
select set_config('request.jwt.claim.sub', :'g1', false);
select pg_temp.ok(jsonb_array_length(lobby() -> 'now') = 1, 'inni nadal widzą wpis');
select set_config('request.jwt.claim.sub', :'host', false);
select instant_leave();

-- Zaplanowane
select (date_trunc('hour', now() at time zone 'Europe/Warsaw') + interval '20 hours') at time zone 'Europe/Warsaw' as slot2 \gset
select book_slot(:'slot2', 75, 'ogrod', 'video', 'Prywatne') ->> 'booking_id' as hb \gset
select set_config('request.jwt.claim.sub', :'g1', false);
select lobby() -> 'scheduled' -> 0 as sentry \gset
select pg_temp.ok((:'sentry'::jsonb) ->> 'booking_id' = :'hb' and (:'sentry'::jsonb) ->> 'name' = 'Anna K.', 'lobby pokazuje zaplanowaną sesję');
select pg_temp.ok(:'sentry' not like '%Prywatne%', 'zaplanowana sesja bez celu');
select book_with(:'hb', 'nauka') as bw \gset
select pg_temp.ok((:'bw'::jsonb) ->> 'status' = 'matched', 'zapis na zaplanowaną sesję wybranej osoby');
select pg_temp.ok((select partner_name from my_bookings() where id = ((:'bw'::jsonb) ->> 'booking_id')::uuid) = 'Anna K.',
  'my_bookings pokazuje skróconą nazwę');
select set_config('request.jwt.claim.sub', :'host', false);
select pg_temp.ok((select status from my_bookings() where id = :'hb') = 'matched', 'gospodarz ma partnera');
select set_config('request.jwt.claim.sub', :'g2', false);
select pg_temp.ok(book_with(:'hb', 'praca') ->> 'status' = 'taken', 'zajęta rezerwacja daje taken');

-- Sesje testowe admina (ta sama osoba po obu stronach)
reset role;
do $$ begin
  insert into sessions (kind, user_a, user_b, activity_a, activity_b, duration, mode, starts_at, ends_at)
  select 'instant', id, id, 'inne', 'inne', 25, 'video', now(), now() + interval '25 minutes' from auth.users limit 1;
  raise exception 'FAIL: zwykła sesja z jedną osobą przyjęta';
exception when check_violation then raise notice 'ok - zwykła sesja wymaga dwóch różnych osób';
end $$;
insert into sessions (kind, user_a, user_b, activity_a, activity_b, duration, mode, starts_at, ends_at)
values ('test', :'a', :'a', 'inne', 'inne', 25, 'audio', now(), now() + interval '25 minutes')
returning id as sid_test \gset
set role authenticated;
select set_config('request.jwt.claim.sub', :'a', false);
select pg_temp.ok(get_session(:'sid_test') ->> 'kind' = 'test', 'admin widzi swoją sesję testową');
select set_config('request.jwt.claim.sub', :'b', false);
select pg_temp.ok(get_session(:'sid_test') is null, 'inni nie widzą sesji testowej');

-- Obecność i odbyta sesja (≥ 10 min razem)
reset role;
create function pg_temp.fails(q text) returns boolean language plpgsql as $$
begin
  execute q;
  return false;
exception when others then
  return true;
end $$;
insert into sessions (kind, user_a, user_b, activity_a, activity_b, duration, mode, starts_at, ends_at)
values ('instant', :'a', :'b', 'praca', 'praca', 25, 'audio', now() - interval '20 minutes', now() + interval '5 minutes')
returning id as sid_att \gset
insert into sessions (kind, user_a, user_b, activity_a, activity_b, duration, mode, starts_at, ends_at)
values ('instant', :'a', :'b', 'praca', 'praca', 25, 'audio', now() - interval '3 hours', now() - interval '2 hours')
returning id as sid_old \gset
set role authenticated;
select set_config('request.jwt.claim.sub', :'c', false);
select pg_temp.ok(pg_temp.fails(format('select session_heartbeat(%L, true)', :'sid_att')), 'obca osoba nie zgłasza obecności');
select set_config('request.jwt.claim.sub', :'a', false);
select session_heartbeat(:'sid_old', true);
select session_heartbeat(:'sid_test', true);
select session_heartbeat(:'sid_att', true);
reset role;
select pg_temp.ok((select count(*) from session_attendance where session_id in (:'sid_old', :'sid_test')) = 0,
  'poza oknem pokoju i w teście obecność się nie liczy');
select pg_temp.ok((select together_seconds from session_attendance where session_id = :'sid_att' and user_id = :'a') = 0,
  'pierwsze zgłoszenie zaczyna liczenie od zera');
update session_attendance set last_beat_at = now() - interval '10 minutes' where session_id = :'sid_att';
set role authenticated;
select set_config('request.jwt.claim.sub', :'a', false);
select session_heartbeat(:'sid_att', true);
select session_heartbeat(:'sid_att', true);
select pg_temp.ok((select together_seconds from session_attendance where session_id = :'sid_att') = 45,
  'jedno zgłoszenie dolicza najwyżej 45 s, częstsze nic nie dodają');
reset role;
update session_attendance set last_beat_at = now() - interval '30 seconds' where session_id = :'sid_att';
set role authenticated;
select session_heartbeat(:'sid_att', false);
select pg_temp.ok((select together_seconds from session_attendance where session_id = :'sid_att') = 45,
  'czas bez partnera się nie liczy');
reset role;
update session_attendance set together_seconds = 300 where session_id = :'sid_att';
set role authenticated;
select pg_temp.ok((my_week_stats() ->> 'attended')::int = 0, 'sesja zakończona po 5 minutach nie jest odbyta');
reset role;
insert into session_attendance (session_id, user_id, together_seconds) values (:'sid_att', :'b', 610);
set role authenticated;
select pg_temp.ok(my_week_stats() = '{"attended": 1, "minutes": 10}'::jsonb, 'zgłoszenie partnera wystarcza: 10 min razem to odbyta sesja');
select pg_temp.ok((select count(*) from session_attendance) = 1, 'RLS: widać tylko własną obecność');
select pg_temp.ok(pg_temp.fails(format('select session_attended(%L)', :'sid_att')), 'funkcje wewnętrzne niedostępne z klienta');

-- Plan Plus: oznaczenie i zaślepka płatności
set role authenticated;
select set_config('request.jwt.claim.sub', :'a', false);
select pg_temp.ok(pg_temp.fails(format('update profiles set plus_until = now() + interval ''1 year'' where id = %L', :'a')),
  'użytkownik nie nada sobie planu Plus');
select pg_temp.ok(get_session(:'sid_att') -> 'partner' ->> 'plus' = 'false', 'bez planu partner nie ma oznaczenia');
reset role;
update profiles set plus_until = now() + interval '1 month' where id = :'b';
set role authenticated;
select set_config('request.jwt.claim.sub', :'a', false);
select pg_temp.ok(get_session(:'sid_att') -> 'partner' ->> 'plus' = 'true', 'partner z Plus ma oznaczenie w sesji');
select pg_temp.ok(get_session(:'sid_att') -> 'me' ->> 'plus' = 'false', 'własny plan widoczny w sesji');
select set_config('request.jwt.claim.sub', :'b', false);
select instant_join(25, 'praca', 'audio');
select set_config('request.jwt.claim.sub', :'c', false);
select pg_temp.ok((select (e ->> 'plus')::boolean from jsonb_array_elements(lobby() -> 'now') e where e ->> 'name' = 'Bartek'),
  'lobby oznacza osobę z Plus');
reset role;
update profiles set plus_until = now() - interval '1 day' where id = :'b';
set role authenticated;
select pg_temp.ok(not (select (e ->> 'plus')::boolean from jsonb_array_elements(lobby() -> 'now') e where e ->> 'name' = 'Bartek'),
  'po wygaśnięciu planu oznaczenie znika');
select set_config('request.jwt.claim.sub', :'b', false);
select instant_leave();
select record_upgrade_intent('yearly', 'blik');
select pg_temp.ok(pg_temp.fails('select record_upgrade_intent(''lifetime'', ''blik'')'), 'nieznany pakiet odrzucony');
select pg_temp.ok((select count(*) from upgrade_intents) = 1, 'zapisane zainteresowanie zakupem');
select set_config('request.jwt.claim.sub', :'c', false);
select pg_temp.ok((select count(*) from upgrade_intents) = 0, 'RLS: cudze zainteresowanie niewidoczne');
reset role;

-- Usunięcie konta
select set_config('request.jwt.claim.sub', :'e', false);
select delete_my_account();
reset role;
select pg_temp.ok(not exists (select 1 from auth.users where email = 'e@test.pl'), 'konto usunięte');
select pg_temp.ok(not exists (select 1 from profiles where display_name = 'Ela'), 'profil usunięty');

\echo 'Wszystkie testy SQL przeszły'
