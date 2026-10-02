-- Uruchom RAZ w Supabase SQL Editor po wdrożeniu aplikacji na Railway.
-- Podmień adres i sekret (ten sam co CRON_SECRET w zmiennych Railway).
-- Wymaga rozszerzeń pg_cron i pg_net (Database → Extensions).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'adehadziaki-przypomnienia',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://TWOJA-APLIKACJA.up.railway.app/api/cron/tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer TWOJ_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Wyłączenie: select cron.unschedule('adehadziaki-przypomnienia');
