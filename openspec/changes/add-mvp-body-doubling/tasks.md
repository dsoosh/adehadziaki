# Tasks

## 1. Fundament projektu

- [x] 1.1 Zainicjalizować Next.js 16 (TypeScript, Tailwind 4, ESLint) i OpenSpec; zweryfikować `npm run build` i `openspec validate --strict`
- [x] 1.2 Dodać zależności (`@supabase/ssr`, `@supabase/supabase-js`, `@daily-co/daily-js`, `web-push`, `lucide-react`, `vitest`, `@playwright/test`) i skrypty `typecheck`, `test`, `test:e2e`; zweryfikować instalację i `npm run typecheck`
- [x] 1.3 Skonfigurować `output: "standalone"`, `railway.json`, `/api/health` i `.env.example`; zweryfikować, że `scripts/start-standalone.sh` odpowiada 200 na `/api/health`

## 2. Design system (adhd-friendly-ui)

- [x] 2.1 Zdefiniować tokeny kolorów (jasny/ciemny), czcionkę Atkinson Hyperlegible, bazowe 18 px i `prefers-reduced-motion` w `globals.css`; zweryfikować kontrast tokenów testem jednostkowym (≥ 4,5:1)
- [x] 2.2 Zbudować komponenty `Button`, `ChoiceTile`, `StepHeader`, `Card`, `Notice`, `Timer` (cele ≥ 48 px) i plik tekstów `copy.ts`; zweryfikować podgląd na stronie głównej w obu motywach

## 3. Baza danych (Supabase)

- [x] 3.1 Migracja: tabele z D3, RLS, trigger tworzący profil przy rejestracji; zweryfikować migrację na lokalnym Postgresie
- [x] 3.2 Funkcje `instant_join`, `instant_leave`, `instant_status` (D4); zweryfikować testem SQL: dopasowanie, różny czas, blokada, trzy równoczesne osoby
- [x] 3.3 Funkcje `book_slot`, `cancel_booking`, `slot_availability` (D5); zweryfikować testem SQL: dopasowanie, konflikt czasu, anulowanie sparowanej rezerwacji
- [x] 3.4 Funkcje `block_user`, `report_user`, `submit_feedback`, `delete_my_account`; zweryfikować testem SQL, że zgłoszenie tworzy blokadę

## 4. Konto i profil (user-auth, user-profile)

- [x] 4.1 Klienci Supabase (przeglądarka/serwer) i `src/proxy.ts` chroniący trasy aplikacji z parametrem powrotu; zweryfikować przekierowanie niezalogowanego na `/logowanie?next=…`
- [x] 4.2 Strony rejestracji (zgoda RODO), logowania (hasło, link magiczny, Google), resetu hasła i callback auth; zweryfikować E2E rejestrację i logowanie na lokalnym Supabase
- [x] 4.3 Strona profilu: nazwa (2–30 znaków), domyślny tryb, powiadomienia, instrukcja instalacji iOS, wylogowanie, usunięcie konta z potwierdzeniem; zweryfikować walidację nazwy testem jednostkowym
- [x] 4.4 Przycisk „Załóż konto przez Google” na rejestracji, ekran powitalny `/witaj` (nazwa + zgoda) wymuszany dla kont bez zgody, funkcja `accept_terms`; zweryfikować testem SQL i E2E konta bez zgody

## 5. Kreator i łączenie natychmiastowe (session-setup, instant-matching)

- [x] 5.1 Ekran „Co robimy?” i kreator 4 kroków (czynność → czas → tryb → cel) z „Krok X z 4” i „Wstecz”; zweryfikować testem jednostkowym logikę kreatora (domyślny tryb audio dla spaceru/sprzątania/ogrodu)
- [x] 5.2 Ekran oczekiwania: `instant_join`, odpytywanie `instant_status` co 2 s, licznik oczekiwania, „Anuluj”, limit 3 min z propozycją najbliższego slotu; zweryfikować E2E dwóch użytkowników trafiających do tej samej sesji

## 6. Rezerwacje (scheduled-sessions)

- [x] 6.1 Funkcje slotów w `slots.ts` (Europe/Warsaw, :00/:30, ≥ 5 min, dziś i jutro); zweryfikować testami Vitest, w tym zmianę czasu
- [x] 6.2 Strona „Zaplanuj”: kreator + lista slotów z „Ktoś już czeka”, rezerwacja, obsługa konfliktu; zweryfikować E2E rezerwację i dopasowanie dwóch osób
- [x] 6.3 Strona „Moje sesje”: status, partner, anulowanie; zweryfikować E2E anulowanie przywracające partnerowi „Czekamy na partnera”

## 7. Pokój rozmowy (call-room)

- [x] 7.1 Route Handler `/api/sessions/[id]/join` (członkostwo, okno czasowe, pokój i token Daily, tryb demo bez klucza); zweryfikować testem jednostkowym okna czasowego i odmowę dla obcej osoby
- [x] 7.2 Strona pokoju: zgoda na media z instrukcją przy odmowie, wideo/audio przez Daily, licznik i pasek, fazy sesji, sygnał 2 min przed końcem, wyciszanie/kamera, „Zakończ” z potwierdzeniem, automatyczne zakończenie; zweryfikować testem jednostkowym wyliczania faz i E2E w trybie demo
- [x] 7.3 Odliczanie przed otwarciem pokoju i obsługa nieobecności partnera po 3 min z „Znajdź kogoś innego”; zweryfikować testem jednostkowym stanów pokoju

## 8. Po sesji i bezpieczeństwo (partner-safety)

- [x] 8.1 Ekran „Jak poszło?” z ocenami, „Jeszcze jedna sesja”, blokowaniem i zgłoszeniem (z pokoju i po sesji); zweryfikować E2E, że po blokadzie osoby nie są łączone

## 9. PWA i powiadomienia (pwa-shell)

- [x] 9.1 `manifest.ts`, ikony 192/512, `public/sw.js` z ekranem offline i rejestracją SW; zweryfikować instalowalność w Lighthouse/Playwright (manifest + SW aktywny)
- [x] 9.2 Subskrypcja push w profilu i po pierwszej rezerwacji, `/api/cron/tick` z przypomnieniami T-10/T-1 i idempotencją, powiadomienie o anulowaniu; zweryfikować testem jednostkowym wyboru przypomnień i ręcznym wywołaniem endpointu

## 10. Strony publiczne i wdrożenie

- [x] 10.1 Strona główna (co to jest, 3 kroki, „Załóż konto”), szkice regulaminu i polityki prywatności; zweryfikować linki E2E
- [x] 10.2 Instrukcja wdrożenia (README: Supabase, Daily, VAPID, Railway, pg_cron); zweryfikować, że `npm run build` przechodzi z samym `.env.example`

## 11. Integracja

- [x] 11.1 Pełny przebieg E2E: rejestracja dwóch osób → „Zacznij teraz” → wspólny pokój (demo) → koniec → ocena; oraz audyt dostępności (axe) kluczowych ekranów bez błędów kontrastu
