-- Plan płatny „Plus” (na razie bez płatności): kto ma plan, oznaczenie przy
-- nazwie w lobby/sesji i zapis zainteresowania zakupem (pomiar popytu).

-- Data końca planu; null = plan darmowy. Kolumny nie ma w grant update dla
-- authenticated, więc użytkownik nie ustawi jej sam (ustawia admin / płatności).
alter table public.profiles add column if not exists plus_until timestamptz;

create or replace function public.is_plus(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select plus_until > now() from public.profiles where id = p_user), false)
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
      'goal', case when s.user_a = me then s.goal_a else s.goal_b end,
      'plus', public.is_plus(me)
    ),
    'partner', jsonb_build_object(
      'name', public.short_name((select display_name from public.profiles where id = partner)),
      'activity', case when s.user_a = me then s.activity_b else s.activity_a end,
      'goal', case when s.user_a = me then s.goal_b else s.goal_a end,
      'plus', public.is_plus(partner)
    ),
    'blocked', public.is_blocked(me, partner),
    'feedback', (select outcome from public.session_feedback where session_id = s.id and user_id = me)
  );
end;
$$;

drop function public.my_bookings();
create or replace function public.my_bookings()
returns table (
  id uuid, slot_start timestamptz, slot_end timestamptz, duration int, activity text,
  mode text, goal text, status text, session_id uuid, partner_name text, partner_plus boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.slot_start, b.slot_end, b.duration, b.activity, b.mode, b.goal, b.status, b.session_id,
    case when s.id is null then null else public.short_name(p.display_name) end,
    s.id is not null and coalesce(p.plus_until > now(), false)
  from public.bookings b
  left join public.sessions s on s.id = b.session_id
  left join public.profiles p on p.id = case when s.user_a = b.user_id then s.user_b else s.user_a end
  where b.user_id = auth.uid()
    and b.status <> 'cancelled'
    and b.slot_end > now()
  order by b.slot_start;
$$;

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
        select q.ticket, public.short_name(p.display_name) as name,
          coalesce(p.plus_until > now(), false) as plus, q.activity, q.duration, q.mode,
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
        select b.id as booking_id, public.short_name(p.display_name) as name,
          coalesce(p.plus_until > now(), false) as plus, b.activity, b.duration, b.mode,
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

-- Zaślepka płatności: zapisujemy wybór pakietu i metody, nic nie pobieramy.
create table public.upgrade_intents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  package text not null check (package in ('monthly', 'yearly')),
  method text not null check (method in ('blik', 'card', 'transfer')),
  created_at timestamptz not null default now()
);
alter table public.upgrade_intents enable row level security;
create policy "zainteresowanie: odczyt własnego" on public.upgrade_intents
  for select using (user_id = auth.uid());

create or replace function public.record_upgrade_intent(p_package text, p_method text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
begin
  if p_package not in ('monthly', 'yearly') or p_method not in ('blik', 'card', 'transfer') then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;
  insert into public.upgrade_intents (user_id, package, method) values (me, p_package, p_method);
end;
$$;

revoke execute on function public.is_plus(uuid) from public, anon, authenticated;
revoke execute on function public.my_bookings(), public.record_upgrade_intent(text, text) from public, anon;
grant execute on function public.my_bookings(), public.record_upgrade_intent(text, text) to authenticated;
