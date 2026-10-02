# Proposal

## Why

Osoby z ADHD często łatwiej zaczynają i kończą zadania, gdy ktoś inny pracuje „obok” (body doubling). Istniejące serwisy (Focusmate) są po angielsku, nastawione na pracę przy biurku i wymagają planowania z wyprzedzeniem. Chcemy szybko sprawdzić, czy Polacy skorzystają z prostej, polskojęzycznej aplikacji, w której można też wspólnie sprzątać, spacerować czy pracować w ogrodzie – dlatego budujemy minimalne MVP jako PWA.

## What Changes

- Nowa aplikacja webowa (PWA) po polsku, instalowalna na telefonie i komputerze.
- Zakładanie konta, logowanie (e-mail + hasło, link magiczny, Google), reset hasła, wylogowanie, usunięcie konta.
- Profil z nazwą wyświetlaną i domyślnym trybem rozmowy (wideo/audio).
- Kreator sesji: wybór czynności, czasu trwania (25 / 50 / 75 min), trybu wideo lub audio i opcjonalnego celu.
- Dwa sposoby łączenia w pary:
  - **Teraz** – kolejka, losowe dobranie osoby czekającej na sesję o tym samym czasie trwania;
  - **Zaplanuj** – rezerwacja slotu o pełnej lub pół godzinie, dobranie partnera przed startem.
- Lista osób czekających na partnera (jak „lobby” w Lichess) z możliwością dołączenia do wybranej osoby – teraz albo na zaplanowaną godzinę.
- Pokój rozmowy 1:1 (wideo lub audio) z licznikiem czasu i prostą strukturą sesji (powitanie → praca → podsumowanie).
- Ekran po sesji z krótką oceną, zgłoszeniem i blokowaniem partnera.
- Przypomnienia o zaplanowanych sesjach (powiadomienia push w PWA).
- Interfejs projektowany pod osoby z ADHD: jedna decyzja na ekran, spokojne barwy, duże elementy, brak rozpraszaczy.

### Poza zakresem

- Sesje grupowe (więcej niż 2 osoby), „ulubieni” i zapraszanie konkretnych osób spoza listy czekających.
- Czat tekstowy, znajomi, profile publiczne, statystyki i grywalizacja.
- Płatności i plany abonamentowe.
- Aplikacje natywne w sklepach (tylko PWA).
- Inne języki niż polski.
- Moderacja w czasie rzeczywistym i weryfikacja tożsamości (MVP ma tylko zgłoszenia i blokowanie).
- Nagrywanie rozmów (nigdy nie nagrywamy).

## Capabilities

### New Capabilities

- `user-auth`: rejestracja, logowanie, wylogowanie, reset hasła, zgoda na regulamin i przetwarzanie danych.
- `user-profile`: nazwa wyświetlana, domyślny tryb rozmowy, usunięcie konta.
- `session-setup`: kreator wyboru czynności, czasu trwania, trybu i celu sesji.
- `instant-matching`: kolejka „Teraz” i losowe łączenie w pary.
- `session-lobby`: lista osób czekających na partnera (teraz i zaplanowane) i dołączanie do wybranej osoby.
- `scheduled-sessions`: rezerwacja slotów, łączenie zaplanowanych sesji, anulowanie i przypomnienia.
- `call-room`: pokój rozmowy wideo/audio 1:1 z licznikiem czasu i fazami sesji.
- `partner-safety`: ocena po sesji, zgłaszanie i blokowanie partnerów, obsługa nieobecności partnera.
- `pwa-shell`: instalowalność, działanie powłoki aplikacji offline, powiadomienia push.
- `adhd-friendly-ui`: testowalne zasady interfejsu przyjaznego osobom z ADHD.

### Modified Capabilities

Brak – to pierwsza zmiana w projekcie.

## Impact

- Nowy kod: aplikacja Next.js w repozytorium (`src/`), migracje bazy Supabase (`supabase/`).
- Zewnętrzne zależności: Supabase (Auth, Postgres, Realtime), Daily.co (wideo/audio), Railway (hosting), Web Push (klucze VAPID).
- Dane osobowe: e-mail, nazwa wyświetlana, historia sesji, zgłoszenia – wymagają polityki prywatności i regulaminu (RODO); przechowywanie w regionie UE.
- Koszty: darmowe progi Supabase, Daily i Railway wystarczą do testu z kilkudziesięcioma użytkownikami.
