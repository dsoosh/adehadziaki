-- Obecność w sesji i „odbyta sesja”.
-- Pokój co 30 s zgłasza, czy obie osoby są razem połączone. Sesja jest odbyta,
-- gdy łączny wspólny czas wynosi co najmniej 10 minut. Wystarczy zgłoszenie
-- jednej strony – wyłączenie wysyłania u siebie nie pozwala uniknąć liczenia.

create table public.session_attendance (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  together_seconds int not null default 0,
  last_beat_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.session_attendance enable row level security;
create policy "obecność: odczyt własnej" on public.session_attendance
  for select using (user_id = auth.uid());

-- Próg odbytej sesji (sekundy wspólnego czasu).
create or replace function public.attended_threshold()
returns int
language sql
immutable
as $$ select 600 $$;

create or replace function public.session_heartbeat(p_session uuid, p_together boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  s public.sessions;
begin
  select * into s from public.sessions where id = p_session;
  if s.id is null or me not in (s.user_a, s.user_b) then
    raise exception 'not_member' using errcode = '42501';
  end if;
  -- Sesje testowe admina i zgłoszenia poza oknem pokoju nie liczą się.
  if s.kind = 'test' or now() not between s.starts_at - interval '5 minutes' and s.ends_at + interval '5 minutes' then
    return;
  end if;

  insert into public.session_attendance as a (session_id, user_id)
  values (p_session, me)
  on conflict (session_id, user_id) do update set
    -- Doliczamy czas od poprzedniego zgłoszenia, najwyżej 45 s – częstsze
    -- wywołania nie zwiększają wyniku, a przerwa w połączeniu się nie liczy.
    together_seconds = a.together_seconds + case
      when p_together then least(45, greatest(0, extract(epoch from now() - a.last_beat_at)))::int
      else 0
    end,
    last_beat_at = now();
end;
$$;

-- Wspólny czas w sesji: większa z wartości zgłoszonych przez obie strony.
create or replace function public.session_together_seconds(p_session uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(together_seconds), 0) from public.session_attendance where session_id = p_session
$$;

create or replace function public.session_attended(p_session uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.session_together_seconds(p_session) >= public.attended_threshold()
$$;

-- Odbyte sesje w bieżącym tygodniu (od poniedziałku, czas polski).
create or replace function public.my_week_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  week_start timestamptz := date_trunc('week', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw';
  r record;
begin
  select count(*)::int as attended, coalesce(sum(t.secs), 0)::int / 60 as minutes
  into r
  from (
    select public.session_together_seconds(s.id) as secs
    from public.sessions s
    where me in (s.user_a, s.user_b) and s.kind <> 'test' and s.starts_at >= week_start
  ) t
  where t.secs >= public.attended_threshold();
  return jsonb_build_object('attended', r.attended, 'minutes', r.minutes);
end;
$$;

revoke execute on function public.session_together_seconds(uuid), public.session_attended(uuid)
  from public, anon, authenticated;
revoke execute on function public.session_heartbeat(uuid, boolean), public.my_week_stats() from public, anon;
grant execute on function public.session_heartbeat(uuid, boolean), public.my_week_stats() to authenticated;
