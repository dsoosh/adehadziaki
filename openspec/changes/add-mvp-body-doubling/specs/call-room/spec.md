# Spec Delta

## Purpose

Zapewnia prywatne połączenie wideo lub audio dwóch osób na czas sesji, z widocznym czasem i prostą strukturą, która pomaga zacząć i skończyć zadanie.

## ADDED Requirements

### Requirement: Prywatny pokój 1:1
Każda sesja MUST mieć osobny pokój rozmowy dostępny wyłącznie dla dwóch uczestników tej sesji. Pokój MUST wygasać najpóźniej 5 minut po planowym końcu sesji. Rozmowy MUST NOT być nagrywane.

#### Scenario: Obca osoba
- **WHEN** zalogowany użytkownik, który nie jest uczestnikiem sesji, otwiera jej adres
- **THEN** system odmawia dostępu i pokazuje komunikat „To nie jest Twoja sesja”

#### Scenario: Po czasie
- **WHEN** uczestnik próbuje dołączyć 10 minut po końcu sesji
- **THEN** system pokazuje informację, że sesja się zakończyła, i nie łączy rozmowy

### Requirement: Zgoda na mikrofon i kamerę
Przed połączeniem system MUST poprosić o dostęp do mikrofonu (oraz kamery w trybie wideo) i wyjaśnić po polsku, po co jest potrzebny. Przy odmowie dostępu MUST pokazać instrukcję, jak go włączyć.

#### Scenario: Odmowa dostępu do mikrofonu
- **WHEN** użytkownik odmawia dostępu do mikrofonu
- **THEN** system pokazuje komunikat z instrukcją włączenia mikrofonu w przeglądarce i przycisk „Spróbuj ponownie”

### Requirement: Licznik czasu
Pokój MUST pokazywać duży licznik pozostałego czasu sesji i pasek postępu. Na 2 minuty przed końcem system SHALL dać delikatny sygnał (dźwięk lub wibracja), który użytkownik może wyłączyć.

#### Scenario: Licznik
- **WHEN** od startu 50-minutowej sesji minęło 20 minut
- **THEN** licznik pokazuje „30:00” pozostałego czasu

### Requirement: Fazy sesji
Sesja SHALL składać się z trzech faz pokazywanych w pokoju: „Powitanie” (pierwsze 2 minuty – powiedzcie, co robicie), „Działamy” (praca, mikrofon można wyciszyć) i „Podsumowanie” (ostatnie 2 minuty – jak poszło?).

#### Scenario: Zmiana fazy
- **WHEN** mijają 2 minuty od startu sesji
- **THEN** pokój pokazuje fazę „Działamy” i podpowiedź, że można wyciszyć mikrofon

### Requirement: Sterowanie rozmową
Uczestnik MUST móc wyciszyć i włączyć mikrofon, wyłączyć i włączyć kamerę (w trybie wideo) oraz opuścić sesję. Opuszczenie sesji przed czasem MUST wymagać potwierdzenia.

#### Scenario: Wcześniejsze wyjście
- **WHEN** uczestnik wybiera „Zakończ” przed upływem czasu sesji i potwierdza
- **THEN** opuszcza rozmowę i trafia na ekran podsumowania sesji

### Requirement: Informacje o partnerze
Pokój MUST pokazywać nazwę wyświetlaną partnera, jego czynność i cel (jeśli został podany).

#### Scenario: Dane partnera
- **WHEN** dwie osoby są w pokoju
- **THEN** każda widzi nazwę, czynność i cel drugiej osoby

### Requirement: Automatyczne zakończenie
Po upływie czasu sesji system MUST zakończyć rozmowę i przenieść obu uczestników na ekran podsumowania.

#### Scenario: Koniec czasu
- **WHEN** licznik dochodzi do 00:00
- **THEN** rozmowa zostaje rozłączona, a uczestnicy widzą ekran „Koniec sesji”
