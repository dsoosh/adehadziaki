-- Lista osób czekających na partnera („lobby”) i skracanie nazw do „Imię I.”.
-- Inne osoby nigdy nie dostają pełnej nazwy wyświetlanej.

-- ---------------------------------------------------------------------------
-- Imię + inicjał
-- ---------------------------------------------------------------------------

-- „Anna Maria Kowalska” → „Anna K.”, „Ania” → „Ania”, puste → „Partner”.
create or replace function public.short_name(p_name text)
returns text
language plpgsql
immutable
as $$
declare
  parts text[];
begin
  parts := regexp_split_to_array(trim(coalesce(p_name, '')), '\s+');
  if parts[1] is null or parts[1] = '' then
    return 'Partner';
  end if;
  if array_length(parts, 1) = 1 then
    return parts[1];
  end if;
  return parts[1] || ' ' || upper(left(parts[array_length(parts, 1)], 1)) || '.';
end;
$$;

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
      'name', coalesce((select display_name from public.profiles where id = me), 'Ty'),
      'activity', case when s.user_a = me then s.activity_a else s.activity_b end,
      'goal', case when s.user_a = me then s.goal_a else s.goal_b end
    ),
    'partner', jsonb_build_object(
      'name', public.short_name((select display_name from public.profiles where id = partner)),
      'activity', case when s.user_a = me then s.activity_b else s.activity_a end,
      'goal', case when s.user_a = me then s.goal_b else s.goal_a end
    ),
    'blocked', public.is_blocked(me, partner),
    'feedback', (select outcome from public.session_feedback where session_id = s.id and user_id = me)
  );
end;
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
    case when s.id is null then null else public.short_name(p.display_name) end
  from public.bookings b
  left join public.sessions s on s.id = b.session_id
  left join public.profiles p on p.id = case when s.user_a = b.user_id then s.user_b else s.user_a end
  where b.user_id = auth.uid()
    and b.status <> 'cancelled'
    and b.slot_end > now()
  order by b.slot_start;
$$;

-- ---------------------------------------------------------------------------
-- Lobby
-- ---------------------------------------------------------------------------

-- Publiczny identyfikator wpisu w kolejce – lista nie ujawnia user_id.
alter table public.match_queue add column if not exists ticket uuid not null default gen_random_uuid();
create unique index if not exists match_queue_ticket_idx on public.match_queue (ticket);

-- Kto teraz czeka na partnera i kto ma zaplanowaną sesję bez partnera.
-- Bez celu sesji – cel widzi dopiero połączony partner.
create or replace function public.lobby()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
begin
  return jsonb_build_object(
    'now', coalesce((
      select jsonb_agg(row_to_json(x) order by x.since)
      from (
        select q.ticket, public.short_name(p.display_name) as name, q.activity, q.duration, q.mode,
          q.created_at as since
        from public.match_queue q
        left join public.profiles p on p.id = q.user_id
        where q.session_id is null
          and q.created_at >= now() - interval '3 minutes'
          and q.user_id <> me
          and not public.is_blocked(me, q.user_id)
        order by q.created_at
        limit 10
      ) x
    ), '[]'::jsonb),
    'scheduled', coalesce((
      select jsonb_agg(row_to_json(y) order by y.slot_start)
      from (
        select b.id as booking_id, public.short_name(p.display_name) as name, b.activity, b.duration, b.mode,
          b.slot_start
        from public.bookings b
        left join public.profiles p on p.id = b.user_id
        where b.status = 'open'
          and b.slot_start >= now() + interval '5 minutes'
          and b.slot_start <= now() + interval '48 hours'
          and b.user_id <> me
          and not public.is_blocked(me, b.user_id)
        order by b.slot_start
        limit 10
      ) y
    ), '[]'::jsonb)
  );
end;
$$;

-- Dołączenie do konkretnej osoby czekającej teraz. Czas i tryb od gospodarza.
create or replace function public.instant_join_ticket(p_ticket uuid, p_activity text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  host public.match_queue;
  sid uuid;
begin
  select * into host
  from public.match_queue
  where ticket = p_ticket
    and session_id is null
    and created_at >= now() - interval '3 minutes'
    and user_id <> me
  for update skip locked;

  if not found or public.is_blocked(me, host.user_id) then
    return jsonb_build_object('status', 'gone');
  end if;

  perform public.check_session_params(host.duration, p_activity, host.mode, null);

  insert into public.sessions (
    kind, user_a, user_b, activity_a, activity_b, goal_a, goal_b,
    duration, mode, starts_at, ends_at
  ) values (
    'instant', host.user_id, me, host.activity, p_activity, host.goal, null,
    host.duration, host.mode, now(), now() + make_interval(mins => host.duration)
  ) returning id into sid;

  -- Gospodarz odbierze sesję przez instant_poll; gość nie czeka już w kolejce.
  update public.match_queue set session_id = sid where user_id = host.user_id;
  delete from public.match_queue where user_id = me;

  return jsonb_build_object('status', 'matched', 'session_id', sid);
end;
$$;

-- Zapis na zaplanowaną sesję konkretnej osoby. Slot, czas i tryb od gospodarza.
create or replace function public.book_with(p_booking uuid, p_activity text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  host public.bookings;
  mine uuid;
  sid uuid;
begin
  select * into host
  from public.bookings
  where id = p_booking
    and status = 'open'
    and user_id <> me
    and slot_start >= now() + interval '5 minutes'
  for update skip locked;

  if not found or public.is_blocked(me, host.user_id) then
    return jsonb_build_object('status', 'taken');
  end if;

  perform public.check_session_params(host.duration, p_activity, host.mode, null);

  begin
    insert into public.bookings (user_id, slot_start, slot_end, duration, activity, mode)
    values (me, host.slot_start, host.slot_end, host.duration, p_activity, host.mode)
    returning id into mine;
  exception when exclusion_violation then
    raise exception 'booking_conflict' using errcode = 'P0001';
  end;

  insert into public.sessions (
    kind, user_a, user_b, activity_a, activity_b, goal_a, goal_b,
    duration, mode, starts_at, ends_at
  ) values (
    'scheduled', host.user_id, me, host.activity, p_activity, host.goal, null,
    host.duration, host.mode, host.slot_start, host.slot_end
  ) returning id into sid;

  update public.bookings set status = 'matched', session_id = sid where id in (host.id, mine);

  return jsonb_build_object(
    'status', 'matched',
    'booking_id', mine,
    'session_id', sid,
    'slot_start', host.slot_start
  );
end;
$$;

revoke execute on function public.short_name(text) from public, anon;
revoke execute on function public.lobby(), public.instant_join_ticket(uuid, text), public.book_with(uuid, text)
  from public, anon;
grant execute on function public.lobby(), public.instant_join_ticket(uuid, text), public.book_with(uuid, text)
  to authenticated;
