# Proposal

## Why

Darmowy plan (3 × 25 min tygodniowo, tylko głos) i płatny „Plus” (bez limitu, 29 zł miesięcznie albo 290 zł rocznie) to ustalony model. Zanim podłączymy płatności, chcemy pokazać plan w aplikacji i zmierzyć, ile osób naprawdę chce go kupić (test „fałszywych drzwi”), a osoby wspierające wyróżnić przy nazwie – jak skrzydełka patrona w Lichess.

## What Changes

- Strona `/plus` z porównaniem planów, wyborem pakietu (miesięczny 29 zł, roczny 290 zł – 2 miesiące gratis) i sposobu płatności (BLIK, karta, szybki przelew).
- Zaślepka płatności: „Przejdź do płatności” zapisuje wybór i informuje, że płatności ruszą wkrótce; nic nie jest pobierane.
- Znaczek w nagłówku: osoba z Plus ma wypełnioną odznakę, osoba bez planu – obrysowaną zachętę „Plus” prowadzącą do porównania.
- Piórko przy nazwie osób z Plus: lista czekających, karta partnera w pokoju, rezerwacje.
- Plan nadaje na razie administrator (kolumna `plus_until`); limit darmowych sesji nie jest jeszcze egzekwowany.

### Poza zakresem

- Prawdziwe płatności (operator, webhooki, faktury) i egzekwowanie limitu – osobna zmiana.

## Capabilities

### New Capabilities

- `plus-plan`: plan Plus – porównanie, oznaczenia, zaślepka płatności i pomiar zainteresowania.

### Modified Capabilities

Brak.

## Impact

- Migracja `20261008000000_plus.sql`: `profiles.plus_until`, `is_plus`, pole `plus` w `lobby()`/`get_session`, `partner_plus` w `my_bookings`, tabela `upgrade_intents` i `record_upgrade_intent`.
- Nagłówek aplikacji czyta profil po stronie serwera.
