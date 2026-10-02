-- Sesje testowe dla administratora: ta sama osoba po obu stronach
-- (drugie urządzenie lub druga karta), żeby sprawdzić kamerę i połączenie.
-- Tworzone wyłącznie przez serwer (service role) po sprawdzeniu ADMIN_EMAILS.

do $$
declare
  c record;
begin
  -- Nazwy ograniczeń CHECK były nadane automatycznie – szukamy ich po definicji.
  for c in
    select conname from pg_constraint
    where conrelid = 'public.sessions'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) like '%user_a <> user_b%' or pg_get_constraintdef(oid) like '%kind%')
  loop
    execute format('alter table public.sessions drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.sessions
  add constraint sessions_kind_check check (kind in ('instant', 'scheduled', 'test')),
  add constraint sessions_users_check check (user_a <> user_b or kind = 'test');
