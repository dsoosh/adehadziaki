-- adehadziaki: schemat MVP body doublingu
-- Zapisy do tabel sesji, kolejki i rezerwacji idą wyłącznie przez funkcje
-- security definer, które sprawdzają auth.uid(). Klienci mają tylko odczyt
-- własnych wierszy (RLS).

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tabele
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  default_mode text not null default 'video' check (default_mode in ('video', 'audio')),
  push_enabled boolean not null default false,
  accepted_terms_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('instant', 'scheduled')),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  activity_a text not null,
  activity_b text not null,
  goal_a text,
  goal_b text,
  duration int not null check (duration in (25, 50, 75)),
  mode text not null check (mode in ('video', 'audio')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  daily_room text,
  created_at timestamptz not null default now(),
  check (user_a <> user_b)
);
create index sessions_user_a_idx on public.sessions (user_a, starts_at desc);
create index sessions_user_b_idx on public.sessions (user_b, starts_at desc);

-- Wiersz z session_id = null oznacza oczekiwanie; po dopasowaniu wiersz
-- zostaje z ustawionym session_id, aż użytkownik odbierze wynik.
create table public.match_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  duration int not null check (duration in (25, 50, 75)),
  activity text not null,
  mode text not null check (mode in ('video', 'audio')),
  goal text check (char_length(goal) <= 120),
  session_id uuid references public.sessions (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index match_queue_waiting_idx on public.match_queue (duration) where session_id is null;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  duration int not null check (duration in (25, 50, 75)),
  activity text not null,
  mode text not null check (mode in ('video', 'audio')),
  goal text check (char_length(goal) <= 120),
  status text not null default 'open' check (status in ('open', 'matched', 'cancelled')),
  session_id uuid references public.sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint bookings_no_overlap exclude using gist (
    user_id with =,
    tstzrange(slot_start, slot_end) with &&
  ) where (status <> 'cancelled')
);
create index bookings_slot_idx on public.bookings (slot_start, duration) where status = 'open';

create table public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  reported_id uuid references auth.users (id) on delete set null,
  session_id uuid references public.sessions (id) on delete set null,
  reason text not null check (reason in ('zachowanie', 'seksualne', 'obrazliwe', 'spam', 'inne')),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now()
);

create table public.session_feedback (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  outcome text not null check (outcome in ('udalo', 'czesciowo', 'nie')),
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.reminders_sent (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind text not null check (kind in ('t10', 't1')),
  sent_at timestamptz not null default now(),
  primary key (booking_id, kind)
);

-- ---------------------------------------------------------------------------
-- RLS: odczyt własnych danych; zapisy przez funkcje
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.match_queue enable row level security;
alter table public.bookings enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.session_feedback enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminders_sent enable row level security;

create policy "profil: odczyt własnego" on public.profiles
  for select using (id = auth.uid());
create policy "profil: zmiana własnego" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "sesje: odczyt uczestnika" on public.sessions
  for select using (auth.uid() in (user_a, user_b));

create policy "kolejka: odczyt własnego wpisu" on public.match_queue
  for select using (user_id = auth.uid());

create policy "rezerwacje: odczyt własnych" on public.bookings
  for select using (user_id = auth.uid());

create policy "blokady: odczyt własnych" on public.blocks
  for select using (blocker_id = auth.uid());

create policy "oceny: odczyt własnych" on public.session_feedback
  for select using (user_id = auth.uid());

create policy "push: własne subskrypcje" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Kolumny profilu, które użytkownik może zmieniać sam.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, default_mode, push_enabled) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Profil tworzony przy rejestracji
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1),
    ''
  ));
  v_name := left(v_name, 30);
  if char_length(v_name) < 2 then
    v_name := 'Użytkownik';
  end if;

  insert into public.profiles (id, display_name, accepted_terms_at)
  values (
    new.id,
    v_name,
    case when new.raw_user_meta_data ? 'accepted_terms_at'
      then (new.raw_user_meta_data ->> 'accepted_terms_at')::timestamptz
      else null end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Pomocnicze
-- ---------------------------------------------------------------------------

create or replace function public.is_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

create or replace function public.require_uid()
returns uuid
language plpgsql
stable
as $$
declare
  v uuid := auth.uid();
begin
  if v is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  return v;
end;
$$;

create or replace function public.check_session_params(p_duration int, p_activity text, p_mode text, p_goal text)
returns void
language plpgsql
immutable
as $$
begin
  if p_duration not in (25, 50, 75) then
    raise exception 'invalid_duration' using errcode = '22023';
  end if;
  if p_activity not in ('praca', 'nauka', 'sprzatanie', 'spacer', 'ogrod', 'gotowanie', 'papiery', 'inne') then
    raise exception 'invalid_activity' using errcode = '22023';
  end if;
  if p_mode not in ('video', 'audio') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  if p_goal is not null and char_length(p_goal) > 120 then
    raise exception 'goal_too_long' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.pair_mode(p_a text, p_b text)
returns text
language sql
immutable
as $$
  select case when p_a = 'audio' or p_b = 'audio' then 'audio' else 'video' end;
$$;

-- ---------------------------------------------------------------------------
-- Łączenie natychmiastowe
-- ---------------------------------------------------------------------------

-- Próbuje dopasować oczekujący wpis p_user z losowym innym oczekującym.
-- Zwraca id nowej sesji albo null. Wymaga, by wiersz p_user był już
-- zablokowany przez wywołującego (FOR UPDATE).
create or replace function public.try_instant_match(p_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.match_queue;
  cand public.match_queue;
  sid uuid;
begin
  select * into me from public.match_queue where user_id = p_user and session_id is null;
  if not found then
    return null;
  end if;

  select q.* into cand
  from public.match_queue q
  where q.session_id is null
    and q.user_id <> p_user
    and q.duration = me.duration
    and q.created_at >= now() - interval '3 minutes'
    and not public.is_blocked(p_user, q.user_id)
  order by random()
  limit 1
  for update skip locked;

  if not found then
    return null;
  end if;

  insert into public.sessions (
    kind, user_a, user_b, activity_a, activity_b, goal_a, goal_b,
    duration, mode, starts_at, ends_at
  ) values (
    'instant', cand.user_id, me.user_id, cand.activity, me.activity, cand.goal, me.goal,
    me.duration, public.pair_mode(cand.mode, me.mode), now(), now() + make_interval(mins => me.duration)
  ) returning id into sid;

  update public.match_queue set session_id = sid where user_id in (cand.user_id, me.user_id);
  return sid;
end;
$$;

create or replace function public.instant_poll()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  q public.match_queue;
  sid uuid;
begin
  -- SKIP LOCKED: jeśli ktoś właśnie nas dopasowuje, po prostu czekamy dalej.
  select * into q from public.match_queue where user_id = me for update skip locked;
  if not found then
    if exists (select 1 from public.match_queue where user_id = me) then
      return jsonb_build_object('status', 'waiting');
    end if;
    return jsonb_build_object('status', 'none');
  end if;

  if q.session_id is not null then
    delete from public.match_queue where user_id = me;
    return jsonb_build_object('status', 'matched', 'session_id', q.session_id);
  end if;

  if q.created_at < now() - interval '3 minutes' then
    delete from public.match_queue where user_id = me;
    return jsonb_build_object('status', 'expired');
  end if;

  sid := public.try_instant_match(me);
  if sid is not null then
    delete from public.match_queue where user_id = me;
    return jsonb_build_object('status', 'matched', 'session_id', sid);
  end if;

  return jsonb_build_object('status', 'waiting', 'since', q.created_at);
end;
$$;

create or replace function public.instant_join(p_duration int, p_activity text, p_mode text, p_goal text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  v_goal text := nullif(trim(p_goal), '');
begin
  perform public.check_session_params(p_duration, p_activity, p_mode, v_goal);

  delete from public.match_queue
  where session_id is null and created_at < now() - interval '3 minutes';
  delete from public.match_queue where user_id = me;

  insert into public.match_queue (user_id, duration, activity, mode, goal)
  values (me, p_duration, p_activity, p_mode, v_goal);

  return public.instant_poll();
end;
$$;

create or replace function public.instant_leave()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  sid uuid;
begin
  -- Jeśli dopasowanie zdążyło nastąpić, zwracamy je, żeby nie zostawić partnera samego.
  delete from public.match_queue where user_id = me returning session_id into sid;
  if sid is not null then
    return jsonb_build_object('status', 'matched', 'session_id', sid);
  end if;
  return jsonb_build_object('status', 'none');
end;
$$;

-- ---------------------------------------------------------------------------
-- Rezerwacje
-- ---------------------------------------------------------------------------

-- Łączy otwartą rezerwację z inną otwartą rezerwacją w tym samym slocie.
create or replace function public.pair_booking(p_booking uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
  cand public.bookings;
  sid uuid;
begin
  select * into b from public.bookings where id = p_booking and status = 'open' for update;
  if not found then
    return null;
  end if;

  select o.* into cand
  from public.bookings o
  where o.status = 'open'
    and o.id <> b.id
    and o.user_id <> b.user_id
    and o.slot_start = b.slot_start
    and o.duration = b.duration
    and not public.is_blocked(b.user_id, o.user_id)
  order by o.created_at
  limit 1
  for update skip locked;

  if not found then
    return null;
  end if;

  insert into public.sessions (
    kind, user_a, user_b, activity_a, activity_b, goal_a, goal_b,
    duration, mode, starts_at, ends_at
  ) values (
    'scheduled', cand.user_id, b.user_id, cand.activity, b.activity, cand.goal, b.goal,
    b.duration, public.pair_mode(cand.mode, b.mode), b.slot_start, b.slot_end
  ) returning id into sid;

  update public.bookings set status = 'matched', session_id = sid where id in (cand.id, b.id);
  return sid;
end;
$$;

create or replace function public.book_slot(
  p_slot_start timestamptz, p_duration int, p_activity text, p_mode text, p_goal text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  v_goal text := nullif(trim(p_goal), '');
  v_local timestamp := p_slot_start at time zone 'Europe/Warsaw';
  v_id uuid;
  sid uuid;
begin
  perform public.check_session_params(p_duration, p_activity, p_mode, v_goal);

  if extract(minute from v_local) not in (0, 30) or extract(second from v_local) <> 0 then
    raise exception 'invalid_slot' using errcode = '22023';
  end if;
  if p_slot_start < now() + interval '5 minutes' or p_slot_start > now() + interval '48 hours' then
    raise exception 'slot_out_of_range' using errcode = '22023';
  end if;

  begin
    insert into public.bookings (user_id, slot_start, slot_end, duration, activity, mode, goal)
    values (me, p_slot_start, p_slot_start + make_interval(mins => p_duration), p_duration, p_activity, p_mode, v_goal)
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'booking_conflict' using errcode = 'P0001';
  end;

  sid := public.pair_booking(v_id);
  return jsonb_build_object(
    'booking_id', v_id,
    'status', case when sid is null then 'open' else 'matched' end,
    'session_id', sid
  );
end;
$$;

create or replace function public.cancel_booking(p_booking uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  b public.bookings;
  partner public.bookings;
  rematched uuid;
begin
  select * into b from public.bookings
  where id = p_booking and user_id = me and status <> 'cancelled'
  for update;
  if not found then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;
  if b.slot_start <= now() then
    raise exception 'booking_started' using errcode = 'P0001';
  end if;

  update public.bookings set status = 'cancelled', session_id = null where id = b.id;

  if b.session_id is null then
    return jsonb_build_object('partner_id', null);
  end if;

  select * into partner from public.bookings
  where session_id = b.session_id and id <> b.id
  for update;

  delete from public.sessions where id = b.session_id;

  if partner.id is null then
    return jsonb_build_object('partner_id', null);
  end if;

  update public.bookings set status = 'open', session_id = null where id = partner.id;
  rematched := public.pair_booking(partner.id);

  return jsonb_build_object('partner_id', partner.user_id, 'partner_rematched', rematched is not null);
end;
$$;

-- Liczba osób czekających w slotach z zakresu (z wyłączeniem siebie i blokad).
create or replace function public.slot_availability(p_from timestamptz, p_to timestamptz, p_duration int)
returns table (slot_start timestamptz, waiting int)
language sql
stable
security definer
set search_path = public
as $$
  select b.slot_start, count(*)::int
  from public.bookings b
  where b.status = 'open'
    and b.duration = p_duration
    and b.slot_start between p_from and p_to
    and b.user_id <> auth.uid()
    and not public.is_blocked(auth.uid(), b.user_id)
  group by b.slot_start;
$$;

create or replace function public.my_bookings()
returns table (
  id uuid, slot_start timestamptz, slot_end timestamptz, duration int, activity text,
  mode text, goal text, status text, session_id uuid, partner_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.slot_start, b.slot_end, b.duration, b.activity, b.mode, b.goal, b.status, b.session_id,
    p.display_name
  from public.bookings b
  left join public.sessions s on s.id = b.session_id
  left join public.profiles p on p.id = case when s.user_a = b.user_id then s.user_b else s.user_a end
  where b.user_id = auth.uid()
    and b.status <> 'cancelled'
    and b.slot_end > now()
  order by b.slot_start;
$$;

-- ---------------------------------------------------------------------------
-- Sesja: szczegóły, pokój, oceny, bezpieczeństwo
-- ---------------------------------------------------------------------------

create or replace function public.get_session(p_session uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  s public.sessions;
  partner uuid;
begin
  select * into s from public.sessions where id = p_session;
  if not found or me not in (s.user_a, s.user_b) then
    return null;
  end if;
  partner := case when s.user_a = me then s.user_b else s.user_a end;

  return jsonb_build_object(
    'id', s.id,
    'kind', s.kind,
    'duration', s.duration,
    'mode', s.mode,
    'starts_at', s.starts_at,
    'ends_at', s.ends_at,
    'daily_room', s.daily_room,
    'me', jsonb_build_object(
      'name', (select display_name from public.profiles where id = me),
      'activity', case when s.user_a = me then s.activity_a else s.activity_b end,
      'goal', case when s.user_a = me then s.goal_a else s.goal_b end
    ),
    'partner', jsonb_build_object(
      'name', (select display_name from public.profiles where id = partner),
      'activity', case when s.user_a = me then s.activity_b else s.activity_a end,
      'goal', case when s.user_a = me then s.goal_b else s.goal_a end
    ),
    'blocked', public.is_blocked(me, partner),
    'feedback', (select outcome from public.session_feedback where session_id = s.id and user_id = me)
  );
end;
$$;

-- Zapisuje nazwę pokoju Daily, jeśli jeszcze jej nie ma; zwraca obowiązującą nazwę.
create or replace function public.set_session_room(p_session uuid, p_room text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  v_room text;
begin
  update public.sessions set daily_room = p_room
  where id = p_session and me in (user_a, user_b) and daily_room is null
  returning daily_room into v_room;
  if v_room is null then
    select daily_room into v_room from public.sessions where id = p_session and me in (user_a, user_b);
  end if;
  return v_room;
end;
$$;

create or replace function public.session_partner(p_session uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  s public.sessions;
begin
  select * into s from public.sessions where id = p_session;
  if not found or me not in (s.user_a, s.user_b) then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;
  return case when s.user_a = me then s.user_b else s.user_a end;
end;
$$;

create or replace function public.submit_feedback(p_session uuid, p_outcome text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
begin
  perform public.session_partner(p_session);
  insert into public.session_feedback (session_id, user_id, outcome)
  values (p_session, me, p_outcome)
  on conflict (session_id, user_id) do update set outcome = excluded.outcome, created_at = now();
end;
$$;

create or replace function public.block_partner(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  partner uuid := public.session_partner(p_session);
begin
  insert into public.blocks (blocker_id, blocked_id) values (me, partner)
  on conflict do nothing;
end;
$$;

create or replace function public.report_partner(p_session uuid, p_reason text, p_details text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  partner uuid := public.session_partner(p_session);
begin
  insert into public.reports (reporter_id, reported_id, session_id, reason, details)
  values (me, partner, p_session, p_reason, nullif(trim(p_details), ''));
  insert into public.blocks (blocker_id, blocked_id) values (me, partner)
  on conflict do nothing;
end;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := public.require_uid();
begin
  delete from auth.users where id = me;
end;
$$;

-- ---------------------------------------------------------------------------
-- Uprawnienia do funkcji
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;

grant execute on function
  public.instant_join(int, text, text, text),
  public.instant_poll(),
  public.instant_leave(),
  public.book_slot(timestamptz, int, text, text, text),
  public.cancel_booking(uuid),
  public.slot_availability(timestamptz, timestamptz, int),
  public.my_bookings(),
  public.get_session(uuid),
  public.set_session_room(uuid, text),
  public.submit_feedback(uuid, text),
  public.block_partner(uuid),
  public.report_partner(uuid, text, text),
  public.delete_my_account()
to authenticated;

-- Funkcje wewnętrzne – tylko dla innych funkcji security definer i service_role.
revoke execute on function
  public.try_instant_match(uuid),
  public.pair_booking(uuid),
  public.session_partner(uuid),
  public.is_blocked(uuid, uuid)
from authenticated;
