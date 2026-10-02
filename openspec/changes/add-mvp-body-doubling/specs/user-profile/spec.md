# Spec Delta

## Purpose

Przechowuje podstawowe informacje o użytkowniku potrzebne do sesji (jak go nazywać, jak woli rozmawiać) i daje mu kontrolę nad własnymi danymi zgodnie z RODO.

## ADDED Requirements

### Requirement: Nazwa wyświetlana
Każdy użytkownik MUST mieć nazwę wyświetlaną o długości 2–30 znaków. Partner w sesji SHALL widzieć wyłącznie nazwę wyświetlaną, nigdy adres e-mail.

#### Scenario: Zmiana nazwy
- **WHEN** użytkownik zmienia nazwę wyświetlaną w profilu na poprawną wartość
- **THEN** system zapisuje ją i używa w kolejnych sesjach

#### Scenario: Nazwa za krótka
- **WHEN** użytkownik podaje nazwę krótszą niż 2 znaki
- **THEN** system nie zapisuje zmian i pokazuje komunikat o wymaganej długości

#### Scenario: Prywatność e-maila
- **WHEN** dwie osoby zostają połączone w sesję
- **THEN** każda z nich widzi nazwę wyświetlaną partnera, a nie jego adres e-mail

### Requirement: Domyślny tryb rozmowy
Użytkownik SHALL móc ustawić domyślny tryb rozmowy (wideo lub audio), który kreator sesji MUST wstępnie zaznaczać.

#### Scenario: Domyślny tryb w kreatorze
- **WHEN** użytkownik z domyślnym trybem „audio” otwiera kreator sesji
- **THEN** krok wyboru trybu ma wstępnie zaznaczone „Tylko głos”

### Requirement: Usunięcie konta
Użytkownik SHALL móc trwale usunąć konto. Usunięcie MUST wymagać potwierdzenia, anulować jego przyszłe rezerwacje i usunąć dane osobowe; zgłoszenia złożone na niego MAY zostać zachowane w formie zanonimizowanej.

#### Scenario: Usunięcie konta
- **WHEN** użytkownik wybiera „Usuń konto” i potwierdza decyzję
- **THEN** system usuwa konto, anuluje jego rezerwacje, wylogowuje go i nie pozwala zalogować się tymi danymi ponownie
