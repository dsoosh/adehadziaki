# Spec Delta

## Purpose

Prowadzi użytkownika krok po kroku przez wybór tego, co chce robić, jak długo i w jakiej formie rozmowy, zanim system dobierze mu partnera.

## ADDED Requirements

### Requirement: Wybór sposobu startu
Ekran startowy SHALL oferować dokładnie dwie główne opcje: „Zacznij teraz” (łączenie natychmiastowe) i „Zaplanuj” (rezerwacja slotu).

#### Scenario: Ekran startowy
- **WHEN** zalogowany użytkownik otwiera aplikację
- **THEN** widzi pytanie „Co robimy?” i dwa przyciski: „Zacznij teraz” oraz „Zaplanuj na później”

### Requirement: Wybór czynności
Kreator MUST pozwolić wybrać jedną czynność z listy: Praca, Nauka, Sprzątanie, Spacer, Prace ogrodowe, Gotowanie, Papierologia, Coś innego. Każda czynność MUST mieć ikonę i polski podpis.

#### Scenario: Wybór czynności
- **WHEN** użytkownik dotyka kafelka „Sprzątanie”
- **THEN** kafelek zostaje zaznaczony i kreator przechodzi do wyboru czasu

### Requirement: Wybór czasu trwania
Kreator MUST pozwolić wybrać czas trwania sesji: 25, 50 lub 75 minut.

#### Scenario: Wybór czasu
- **WHEN** użytkownik wybiera „50 min”
- **THEN** kreator zapamiętuje czas i przechodzi do wyboru trybu rozmowy

### Requirement: Wybór trybu rozmowy
Kreator MUST pozwolić wybrać tryb „Kamera i głos” albo „Tylko głos”. Tryb audio SHALL być odpowiedni dla czynności w ruchu (spacer, sprzątanie, ogród).

#### Scenario: Sugestia audio dla spaceru
- **WHEN** użytkownik wybrał czynność „Spacer”
- **THEN** w kroku trybu opcja „Tylko głos” jest wstępnie zaznaczona i opisana jako wygodna w ruchu

### Requirement: Opcjonalny cel sesji
Przed rozpoczęciem szukania partnera użytkownik SHALL móc wpisać cel sesji (do 120 znaków). Pole MUST być opcjonalne.

#### Scenario: Pominięcie celu
- **WHEN** użytkownik zostawia pole celu puste i wybiera „Szukaj partnera”
- **THEN** system rozpoczyna szukanie bez celu

#### Scenario: Cel widoczny dla partnera
- **WHEN** użytkownik wpisał cel „Umyć okna w kuchni” i został połączony
- **THEN** partner widzi ten cel w pokoju rozmowy

### Requirement: Nawigacja w kreatorze
Każdy krok kreatora MUST pokazywać numer kroku i liczbę kroków oraz umożliwiać powrót do poprzedniego kroku bez utraty dokonanych wyborów.

#### Scenario: Powrót do poprzedniego kroku
- **WHEN** użytkownik w kroku 3 wybiera „Wstecz”
- **THEN** widzi krok 2 z zaznaczonym wcześniej wyborem
