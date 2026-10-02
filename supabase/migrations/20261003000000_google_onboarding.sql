-- Zgoda na regulamin dla kont założonych przez Google (OAuth pomija formularz rejestracji).

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
  update public.profiles
  set display_name = v_name,
      accepted_terms_at = coalesce(accepted_terms_at, now())
  where id = me;
end;
$$;

revoke execute on function public.accept_terms(text) from public, anon;
grant execute on function public.accept_terms(text) to authenticated;
