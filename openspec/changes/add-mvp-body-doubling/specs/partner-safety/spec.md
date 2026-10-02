# Spec Delta

## Purpose

Daje użytkownikom podstawowe narzędzia bezpieczeństwa i informacji zwrotnej: ocenę sesji, zgłaszanie i blokowanie partnerów oraz obsługę sytuacji, gdy partner się nie pojawi.

## ADDED Requirements

### Requirement: Podsumowanie sesji
Po sesji system SHALL zapytać „Jak poszło?” z trzema odpowiedziami: „Udało się”, „Częściowo”, „Nie tym razem”. Odpowiedź MUST być opcjonalna i nie może być widoczna dla partnera.

#### Scenario: Ocena sesji
- **WHEN** użytkownik po sesji wybiera „Udało się”
- **THEN** system zapisuje odpowiedź i pokazuje przyciski „Jeszcze jedna sesja” oraz „Na dziś wystarczy”

### Requirement: Zgłoszenie partnera
Użytkownik SHALL móc zgłosić partnera z pokoju rozmowy lub z ekranu po sesji, wybierając powód (niestosowne zachowanie, treści seksualne, obraźliwe słowa, spam/reklama, inne) i opcjonalny opis. Zgłoszenie MUST automatycznie blokować zgłoszoną osobę dla zgłaszającego.

#### Scenario: Zgłoszenie
- **WHEN** użytkownik zgłasza partnera z powodem „obraźliwe słowa”
- **THEN** system zapisuje zgłoszenie, blokuje partnera dla zgłaszającego i potwierdza „Dziękujemy. Nie połączymy Was ponownie.”

#### Scenario: Zgłoszenie w trakcie rozmowy
- **WHEN** użytkownik zgłasza partnera w trakcie rozmowy
- **THEN** rozmowa zostaje dla niego natychmiast zakończona

### Requirement: Blokowanie
Użytkownik SHALL móc zablokować partnera bez zgłaszania. Zablokowana osoba MUST NOT dowiedzieć się o blokadzie.

#### Scenario: Blokada bez zgłoszenia
- **WHEN** użytkownik na ekranie po sesji wybiera „Nie łącz mnie więcej z tą osobą”
- **THEN** system zapisuje blokadę, a obie osoby nie będą łączone w przyszłości

### Requirement: Nieobecność partnera
Jeśli partner nie dołączy do pokoju w ciągu 3 minut od startu sesji, system MUST zaproponować obecnej osobie szukanie nowego partnera w kolejce „Zacznij teraz” z tym samym czasem trwania.

#### Scenario: Partner się nie pojawił
- **WHEN** minęły 3 minuty od startu, a partner nie dołączył
- **THEN** obecna osoba widzi komunikat „Partner się nie pojawił” i przycisk „Znajdź kogoś innego”
