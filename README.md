# Adehadziaki

Body doubling po polsku. Wybierasz, co chcesz zrobić (praca, nauka, sprzątanie, spacer, prace ogrodowe…) i jak długo, a aplikacja łączy Cię z drugą osobą na wspólną sesję wideo lub audio. MVP do szybkiego sprawdzenia pomysłu, działa jako PWA.

- **Specyfikacja:** [`openspec/changes/add-mvp-body-doubling/`](openspec/changes/add-mvp-body-doubling/) – propozycja, projekt techniczny, zadania i wymagania (OpenSpec).
- **Stos:** Next.js 16 (App Router) · Supabase (Auth, Postgres z RLS) · Daily.co (wideo/audio) · Railway (hosting).

## Uruchomienie lokalne

Wymagania: Node 22+, Docker (dla lokalnego Supabase).

```bash
npm install
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,storage-api,postgres-meta,supavisor,realtime,mailpit
npx supabase status -o env   # skopiuj API_URL, ANON_KEY i SERVICE_ROLE_KEY do .env.local
cp .env.example .env.local   # uzupełnij NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Lokalnie potwierdzanie e-maila jest wyłączone (`supabase/config.toml`), więc rejestracja od razu loguje. Bez `DAILY_API_KEY` pokój działa w **trybie demonstracyjnym** (podgląd własnej kamery, licznik i fazy sesji, bez połączenia z partnerem).

## Testy

| Polecenie | Co sprawdza |
|---|---|
| `npm test` | logika: sloty i strefa czasowa, fazy sesji, przypomnienia, kontrast palety, walidacja |
| `npm run test:db` | funkcje SQL łączenia w pary, rezerwacji, blokad i RLS na czystym Postgresie (atrapa `auth`), w tym wyścig trzech osób; uruchamiać jako superużytkownik Postgresa |
| `npm run test:e2e` | Playwright: strony publiczne, PWA, a z lokalnym Supabase pełne przepływy dwóch użytkowników + audyt dostępności (axe) |
| `npm run lint`, `npm run typecheck` | ESLint i TypeScript |

Do E2E z przeglądarką spoza Playwrighta ustaw `CHROMIUM_PATH`. Przepływy z logowaniem są pomijane, jeśli nie ma `NEXT_PUBLIC_SUPABASE_URL`.

## Wdrożenie

### 1. Supabase
1. Utwórz projekt w regionie **Frankfurt (eu-central-1)**.
2. `npx supabase link --project-ref <ref>` i `npx supabase db push` – zakłada tabele, RLS i funkcje.
3. Authentication → URL Configuration: *Site URL* = adres z Railway, *Redirect URLs* = `https://<domena>/auth/callback`.
4. (Opcjonalnie) Authentication → Providers → Google: włącz i podaj klucze OAuth z Google Cloud.
5. Authentication → Email Templates: przetłumacz treści e-maili na polski.

### 2. Daily.co
Załóż konto, skopiuj klucz API (Developers) do `DAILY_API_KEY`. Pokoje tworzą się automatycznie (prywatne, 2 osoby, wygasają 5 min po końcu sesji, region UE, bez nagrywania).

### 3. Powiadomienia push
`npx web-push generate-vapid-keys` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`; ustaw `VAPID_SUBJECT` (mailto) i losowy `CRON_SECRET`.

### 4. Railway
1. New Project → Deploy from GitHub repo → to repozytorium. Build i start są w [`railway.json`](railway.json) (Next.js `standalone`, healthcheck `/api/health`).
2. Variables: wszystkie zmienne z [`.env.example`](.env.example); `NEXT_PUBLIC_SITE_URL` = publiczna domena serwisu. Zmienne `NEXT_PUBLIC_*` są wbudowywane przy buildzie – po ich zmianie zrób redeploy.
3. Settings → Networking → Generate Domain (lub własna domena).

### 5. Przypomnienia (pg_cron)
W Supabase SQL Editor uruchom [`supabase/cron.sql`](supabase/cron.sql) z podmienionym adresem Railway i `CRON_SECRET`. Co minutę wywoła `/api/cron/tick`, który wysyła przypomnienia 10 min i 1 min przed zaplanowaną sesją.

## Struktura

```
openspec/                 specyfikacja (OpenSpec)
supabase/migrations/      schemat, RLS, funkcje łączenia w pary
supabase/sql-tests/       testy SQL (scripts/test-db.sh)
src/app/(auth)/           logowanie, rejestracja, reset hasła
src/app/(app)/            start, teraz, zaplanuj, sesje, sesja/[id], profil
src/app/api/              join (Daily), cron/tick (push), health
src/components/ui/        komponenty interfejsu przyjaznego ADHD
src/lib/                  logika domenowa (sloty, fazy sesji, przypomnienia, paleta)
public/sw.js              service worker: offline i push
e2e/                      testy Playwright
```
