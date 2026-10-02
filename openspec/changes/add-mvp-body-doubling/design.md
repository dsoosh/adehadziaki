# Design

## Context

Repozytorium startuje od zera. Motywacja i zakres: patrz `proposal.md`; wymagania: `specs/`. Ograniczenia: mały zespół, szybka weryfikacja pomysłu, minimalne koszty, hosting na Railway, dane w UE (RODO), odbiorcy korzystający głównie z telefonów.

## Goals / Non-Goals

**Goals:**
- Jak najmniej własnej infrastruktury: auth, baza i uprawnienia w Supabase; wideo w Daily.
- Łączenie w pary odporne na wyścigi (dwie osoby nigdy nie trafią do dwóch sesji naraz).
- Jedna aplikacja Next.js uruchamiana jako pojedynczy serwis na Railway.
- Możliwość lokalnego uruchomienia i testów E2E bez kluczy Daily (tryb demonstracyjny).

**Non-Goals:**
- Skalowanie powyżej kilkuset jednoczesnych użytkowników.
- Własny serwer mediów, TURN czy SFU.
- Panel moderatora (zgłoszenia przeglądamy na razie w panelu Supabase).

## Decisions

### D1. Next.js 16 (App Router) jako jedna aplikacja, `output: "standalone"` na Railway
Strony renderowane po stronie serwera + Route Handlers dla operacji wymagających sekretów (Daily, push, cron). Railway buduje obraz z `package.json` (Railpack) i uruchamia `scripts/start-standalone.sh` (serwer standalone na `0.0.0.0:$PORT`). Konfiguracja usługi jest kodem w `.railway/railway.ts` (Railway Infrastructure as Code; Config as Code / `railway.json` jest przez Railway wycofany): start, `preDeploy` z migracjami Supabase, healthcheck `/api/health`, domena i lista zmiennych z `preserve()`. Zmiany stosuje GitHub Actions (`railway config plan` przy PR, `apply` po merge do `main`).
*Alternatywy:* osobny backend (Fastify) – więcej serwisów do utrzymania; Vercel – odrzucony na rzecz Railway zgodnie z decyzją zespołu.

### D2. Supabase: Auth + Postgres z RLS, logika łączenia w funkcjach SQL
Klient Supabase (`@supabase/ssr`) trzyma sesję w ciasteczkach; `src/proxy.ts` (następca middleware w Next 16) odświeża sesję i przekierowuje niezalogowanych z tras `(app)`. Wszystkie tabele mają RLS; zapis do `sessions`, `match_queue` i `bookings` odbywa się wyłącznie przez funkcje `security definer`, które sprawdzają `auth.uid()`.
*Alternatywy:* Prisma + własny auth (NextAuth) – więcej kodu i odpowiedzialności za bezpieczeństwo haseł.

### D3. Model danych
- `profiles(id → auth.users, display_name, default_mode, push_enabled, created_at)`
- `match_queue(user_id PK, duration, activity, mode, goal, created_at)`
- `bookings(id, user_id, slot_start, duration, activity, mode, goal, status[open|matched|cancelled], session_id, created_at)` + ograniczenie wykluczające nakładanie się (`EXCLUDE USING gist` na `tstzrange` dla aktywnych rezerwacji użytkownika).
- `sessions(id, user_a, user_b, activity_a, activity_b, goal_a, goal_b, duration, mode, starts_at, ends_at, kind[instant|scheduled], daily_room, created_at)`
- `session_feedback(session_id, user_id, outcome)`, `blocks(blocker_id, blocked_id)`, `reports(id, reporter_id, reported_id, session_id, reason, details)`
- `push_subscriptions(id, user_id, endpoint UNIQUE, p256dh, auth)`
- `reminders_sent(booking_id, kind)` – idempotencja przypomnień.

### D4. Łączenie natychmiastowe: funkcja `instant_join` + odpytywanie
`instant_join(duration, activity, mode, goal)` w jednej transakcji: usuwa stare wpisy (> 3 min), usuwa poprzedni wpis wywołującego, wybiera losowego kandydata `ORDER BY random() LIMIT 1 FOR UPDATE SKIP LOCKED` z tym samym `duration`, bez blokad w żadną stronę; jeśli jest – usuwa jego wpis i tworzy `sessions` (start = teraz), w przeciwnym razie wstawia wpis wywołującego. `instant_status()` zwraca id sesji, jeśli wywołujący został dobrany (sesja z ostatnich 5 min), lub stan oczekiwania. Klient odpytuje co 2 s. `SKIP LOCKED` + `PRIMARY KEY(user_id)` gwarantują brak podwójnych dopasowań.
*Alternatywa:* Supabase Realtime – mniej zapytań, ale trudniejsze testowanie i obsługa ponownych połączeń; można dodać później bez zmiany specyfikacji.

### D5. Rezerwacje: `book_slot` paruje w momencie rezerwacji
`book_slot(slot_start, duration, activity, mode, goal)` waliduje slot (pełna/pół godziny, ≥ 5 min w przyszłości, ≤ 48 h), wstawia rezerwację i w tej samej transakcji szuka innej `open` rezerwacji z tym samym `slot_start`+`duration` (bez blokad, `SKIP LOCKED`). Przy dopasowaniu tworzy `sessions` (kind `scheduled`) i ustawia obu `matched`. `cancel_booking(id)` przy sparowanej rezerwacji usuwa sesję i przywraca partnerowi `open` (D7 wysyła powiadomienie). Rezerwacja bez partnera w chwili startu: pokój pokazuje stan „brak partnera” i proponuje kolejkę natychmiastową (wymaganie z `partner-safety` i `scheduled-sessions`) – bez zadań w tle.

### D6. Daily.co: pokój tworzony leniwie przy wejściu
`POST /api/sessions/[id]/join` (Route Handler): sprawdza członkostwo i okno czasowe, tworzy pokój Daily jeśli `daily_room` jest pusty (`privacy: private`, `max_participants: 2`, `exp` = koniec + 5 min, `enable_recording` wyłączone, region UE), zapisuje nazwę atomowo (`update … where daily_room is null`), wystawia token spotkania z `user_name` i `exp`. Klient używa `@daily-co/daily-js` (call object) z własnym UI. Bez `DAILY_API_KEY` endpoint zwraca tryb demonstracyjny – pokój pokazuje lokalny podgląd kamery i licznik, co pozwala testować przepływ lokalnie.
*Alternatywy:* LiveKit Cloud (podobny), czyste WebRTC (zawodne za NAT), Jitsi (słaba kontrola UI).

### D7. Przypomnienia push: Web Push + `pg_cron`
Service worker (`public/sw.js`, pisany ręcznie – bez wtyczek, które nie wspierają Turbopacka) obsługuje `push` i `notificationclick` oraz ekran offline. Supabase `pg_cron` co minutę wywołuje przez `pg_net` endpoint `POST /api/cron/tick` z nagłówkiem `CRON_SECRET`; endpoint wysyła przypomnienia T-10 i T-1 (`web-push`, klucze VAPID) i zapisuje je w `reminders_sent`. Powiadomienia o anulowaniu wysyłane są bezpośrednio z akcji anulowania.
*Alternatywa:* cron Railway – minimalny interwał zbyt duży dla przypomnień „za 1 minutę”.

### D8. UI: Tailwind 4 + własne komponenty, tokeny w CSS
Tokeny kolorów jako zmienne CSS na `:root` z wariantem `:root[data-theme="dark"]` (domyślnie jasny; przełącznik w pasku zapisuje wybór w `localStorage`, a skrypt w `<head>` stosuje go przed pierwszym odmalowaniem – bez mignięcia); czcionka Atkinson Hyperlegible (`next/font/google`), 18 px bazowo. Komponenty: `Button`, `ChoiceTile`, `StepHeader`, `Card`, `Notice`, `Timer`. Teksty w `src/lib/copy.ts`. Paleta stonowana, przyjazna osobom z ADHD: ciepłe kremowe tło, przygaszona szałwiowa zieleń jako jedyny akcent, ziemiste kolory stanu (ochra, terakota) zamiast jaskrawych. Tekst ma kontrast ok. 10:1 zamiast „czerni na bieli” (~15:1) – mniej ostry, nadal powyżej WCAG AA; każdą parę sprawdza `src/lib/theme.test.ts`.

| token | jasny | ciemny |
|---|---|---|
| `--bg` | `#F3F0E8` | `#1B201D` |
| `--surface` | `#FAF8F3` | `#232925` |
| `--text` | `#2F3A34` | `#E3E6E0` |
| `--muted` | `#59625B` | `#A8B0A8` |
| `--accent` | `#4A6B57` (szałwia) | `#9DBFA8` |
| `--success` | `#3D6649` | `#A6CCB0` |
| `--warning` | `#85582A` (ochra) | `#D9B48C` |
| `--danger` | `#9A4636` (terakota) | `#E3A596` |

*Alternatywa:* chłodny niebieski akcent (pierwsza wersja) – odrzucony jako zbyt intensywny; jaskrawe kolory podstawowe i neony mogą nadmiernie pobudzać.

### D9. Czas i strefy
Wszystkie znaczniki w bazie w UTC (`timestamptz`); sloty liczone i prezentowane w `Europe/Warsaw` przez `Intl.DateTimeFormat` (bez dodatkowych bibliotek). Logika slotów w czystych funkcjach (`src/lib/slots.ts`) pokrytych testami Vitest.

## Risks / Trade-offs

- [Mała liczba użytkowników → długie oczekiwanie w kolejce] → limit 3 min z propozycją slotu; sloty pokazują „Ktoś już czeka”; łączenie ignoruje czynność.
- [Odpytywanie co 2 s obciąża bazę] → przy obecnej skali pomijalne; migracja na Realtime bez zmiany specyfikacji.
- [iOS: push tylko dla zainstalowanej PWA (16.4+)] → instrukcja instalacji w profilu; przypomnienia e-mail jako ewentualny następny krok.
- [Nadużycia w rozmowach wideo] → domyślny tryb audio dla czynności w ruchu, zgłoszenia + automatyczna blokada, regulamin; ręczny przegląd zgłoszeń.
- [Pokój Daily utworzony podwójnie przy jednoczesnym wejściu] → zapis nazwy pokoju warunkowy; przegrany usuwa swój pokój i używa zapisanego.
- [`pg_cron`/`pg_net` niedostępne lokalnie] → endpoint `/api/cron/tick` można wywołać ręcznie; testy jednostkowe logiki wyboru przypomnień.

## Migration Plan

1. Utworzyć projekt Supabase (region Frankfurt), uruchomić migracje z `supabase/migrations/` (`supabase db push`), włączyć dostawcę Google i ustawić adresy przekierowań.
2. Utworzyć konto Daily (region UE), wygenerować klucze VAPID (`npx web-push generate-vapid-keys`).
3. Railway: nowy projekt z repozytorium GitHub, zmienne z `.env.example`; pierwsze `railway config apply` lokalnie, potem sekret `RAILWAY_TOKEN` dla GitHub Actions.
4. W Supabase ustawić `pg_cron` z adresem Railway i `CRON_SECRET`.
Wycofanie: Railway umożliwia powrót do poprzedniego wdrożenia; migracje są addytywne.

## Open Questions

- Ostateczna nazwa i domena produktu (roboczo „adehadziaki”) – nie wpływa na specyfikację.
- Treść regulaminu i polityki prywatności – w MVP szkice do weryfikacji prawnej.
