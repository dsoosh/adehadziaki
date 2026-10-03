# Tasks

## 1. Dane

- [x] 1.1 Migracja: `profiles.plus_until` (bez prawa zmiany przez użytkownika), `is_plus`, pole `plus` w `lobby()` i `get_session`, `partner_plus` w `my_bookings`, `upgrade_intents` + `record_upgrade_intent`; zweryfikować testami SQL (brak samodzielnego nadania, oznaczenie i wygaśnięcie, walidacja, RLS)

## 2. Interfejs

- [x] 2.1 `plans.ts` (pakiety, metody, porównanie, `isPlus`) i piórko `PlusMark` przy nazwach; zweryfikować testem jednostkowym `isPlus` i ceny rocznej 290 zł
- [x] 2.3 Plus automatycznie dla `ADMIN_EMAILS` (ustawiany na rok przy wejściu, odnawiany 30 dni przed końcem); zweryfikować testem jednostkowym `adminPlusUntil` i E2E (odznaka admina, piórko widoczne dla innych)
- [x] 2.2 Odznaka / zachęta „Plus” w nagłówku i strona `/plus` z porównaniem, wyborem pakietu i płatności (zaślepka); zweryfikować E2E obu ścieżek, axe w obu motywach i szerokość 360 px
