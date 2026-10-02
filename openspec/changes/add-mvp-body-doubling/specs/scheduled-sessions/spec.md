# Spec Delta

## Purpose

Pozwala umówić sesję z wyprzedzeniem na konkretną godzinę, dzięki czemu łatwiej znaleźć partnera i zbudować rutynę.

## ADDED Requirements

### Requirement: Dostępne sloty
System SHALL prezentować sloty startujące o pełnej godzinie i o wpół do (czas Europe/Warsaw) na dziś i jutro, pomijając sloty zaczynające się za mniej niż 5 minut. Przy każdym slocie SHALL być widoczna informacja, czy ktoś już czeka na partnera w tym slocie dla wybranego czasu trwania.

#### Scenario: Lista slotów
- **WHEN** o 14:10 użytkownik otwiera „Zaplanuj na później”
- **THEN** pierwszym slotem na liście jest 14:30, a lista obejmuje też sloty jutrzejsze

#### Scenario: Ktoś czeka
- **WHEN** w slocie 18:00 dla 50 min istnieje niesparowana rezerwacja innej osoby
- **THEN** slot 18:00 jest oznaczony etykietą „Ktoś już czeka”

### Requirement: Rezerwacja slotu
Użytkownik SHALL móc zarezerwować slot podając czynność, czas trwania i tryb. Użytkownik MUST NOT mieć dwóch rezerwacji nachodzących na siebie w czasie.

#### Scenario: Rezerwacja
- **WHEN** użytkownik wybiera slot 18:00 i potwierdza rezerwację
- **THEN** rezerwacja pojawia się na liście „Moje sesje” z godziną i statusem

#### Scenario: Konflikt rezerwacji
- **WHEN** użytkownik ma rezerwację 18:00–18:50 i próbuje zarezerwować 18:30
- **THEN** system odrzuca rezerwację z komunikatem, że o tej porze ma już sesję

### Requirement: Łączenie zaplanowanych sesji
Rezerwacja MUST zostać połączona w parę z inną niesparowaną rezerwacją o tym samym czasie startu i czasie trwania, z wyłączeniem osób zablokowanych. Status rezerwacji SHALL pokazywać „Masz partnera: <nazwa>” lub „Czekamy na partnera”.

#### Scenario: Dopasowanie przy rezerwacji
- **WHEN** osoba B rezerwuje slot 18:00 / 50 min, w którym czeka rezerwacja osoby A
- **THEN** obie rezerwacje zostają połączone i każda osoba widzi nazwę partnera

#### Scenario: Brak partnera przed startem
- **WHEN** 2 minuty przed startem rezerwacja nadal nie ma partnera
- **THEN** system próbuje dobrać partnera spośród osób w kolejce „Zacznij teraz” o tym samym czasie trwania, a jeśli się nie uda, informuje użytkownika i proponuje ponowne szukanie

### Requirement: Anulowanie rezerwacji
Użytkownik SHALL móc anulować rezerwację. Gdy rezerwacja miała partnera, partner MUST zostać powiadomiony, a jego rezerwacja wraca do stanu „Czekamy na partnera”.

#### Scenario: Anulowanie sparowanej rezerwacji
- **WHEN** osoba A anuluje rezerwację sparowaną z osobą B
- **THEN** rezerwacja B ma status „Czekamy na partnera”, a B dostaje powiadomienie o zmianie

### Requirement: Przypomnienia
System SHALL wysłać przypomnienie push 10 minut i 1 minutę przed startem zaplanowanej sesji, jeśli użytkownik włączył powiadomienia. Dotknięcie przypomnienia MUST otwierać pokój sesji.

#### Scenario: Przypomnienie
- **WHEN** do startu rezerwacji zostało 10 minut, a użytkownik ma włączone powiadomienia
- **THEN** otrzymuje powiadomienie „Za 10 minut: Sprzątanie z Kasią”

### Requirement: Wejście do zaplanowanej sesji
Pokój zaplanowanej sesji MUST być dostępny od 5 minut przed startem do końca sesji.

#### Scenario: Za wcześnie
- **WHEN** użytkownik otwiera sesję 20 minut przed startem
- **THEN** widzi odliczanie do otwarcia pokoju zamiast rozmowy
