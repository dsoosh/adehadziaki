-- Profile dla kont bez wiersza w profiles (konta założone, zanim na bazie
-- była migracja init z triggerem) oraz nazwy z zapasem w get_session.

-- Wspólna logika nazwy wyświetlanej (trigger rejestracji i backfill).
create or replace function public.default_display_name(p_meta jsonb, p_email text)
returns text
language plpgsql
immutable
as $$
declare
  v_name text;
begin
  v_name := left(trim(coalesce(
    p_meta ->> 'display_name',
    p_meta ->> 'full_name',
    p_meta ->> 'name',
    split_part(p_email, '@', 1),
    ''
  )), 30);
  if char_length(v_name) < 2 then
    v_name := 'Użytkownik';
  end if;
  return v_name;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, accepted_terms_at)
  values (
    new.id,
    public.default_display_name(new.raw_user_meta_data, new.email),
    case when new.raw_user_meta_data ? 'accepted_terms_at'
      then (new.raw_user_meta_data ->> 'accepted_terms_at')::timestamptz
      else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Zakłada brakujące profile. Brak zgody w metadanych = accepted_terms_at null,
-- więc taka osoba przejdzie przez ekran /witaj. Zwraca liczbę założonych profili.
create or replace function public.backfill_profiles()
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count int;
begin
  insert into public.profiles (id, display_name, accepted_terms_at)
  select
    u.id,
    public.default_display_name(u.raw_user_meta_data, u.email),
    case when u.raw_user_meta_data ? 'accepted_terms_at'
      then (u.raw_user_meta_data ->> 'accepted_terms_at')::timestamptz
      else null end
  from auth.users u
  where not exists (select 1 from public.profiles p where p.id = u.id)
  on conflict (id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select public.backfill_profiles();

-- accept_terms zakłada profil, jeśli go nie ma.
create or replace function public.accept_terms(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.require_uid();
  v_name text := trim(p_display_name);
begin
  if char_length(v_name) not between 2 and 30 then
    raise exception 'invalid_display_name' using errcode = '22023';
  end if;
  insert into public.profiles (id, display_name, accepted_terms_at)
  values (me, v_name, now())
  on conflict (id) do update
    set display_name = excluded.display_name,
        accepted_terms_at = coalesce(public.profiles.accepted_terms_at, now());
end;
$$;

-- get_session: nazwy nigdy nie są null (np. partner usunął konto).
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
      'name', coalesce((select display_name from public.profiles where id = partner), 'Partner'),
      'activity', case when s.user_a = me then s.activity_b else s.activity_a end,
      'goal', case when s.user_a = me then s.goal_b else s.goal_a end
    ),
    'blocked', public.is_blocked(me, partner),
    'feedback', (select outcome from public.session_feedback where session_id = s.id and user_id = me)
  );
end;
$$;

revoke execute on function public.backfill_profiles() from public, anon, authenticated;
revoke execute on function public.default_display_name(jsonb, text) from public, anon, authenticated;
grant execute on function public.backfill_profiles() to service_role;
