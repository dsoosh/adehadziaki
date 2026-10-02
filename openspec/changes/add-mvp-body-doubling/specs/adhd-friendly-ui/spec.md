# Spec Delta

## Purpose

Określa sprawdzalne zasady interfejsu, dzięki którym aplikacja jest czytelna i nie przytłacza osób z ADHD: mało bodźców, jasne kroki, spokojne barwy.

## ADDED Requirements

### Requirement: Jedna decyzja na ekran
Każdy ekran przepływu (kreator, oczekiwanie, podsumowanie) MUST zawierać jedno pytanie lub jedną główną akcję. Główny przycisk MUST być wyróżniony kolorem akcentu, a pozostałe akcje MUST mieć styl drugorzędny.

#### Scenario: Ekran kreatora
- **WHEN** użytkownik jest w kroku wyboru czasu
- **THEN** ekran zawiera tylko pytanie „Jak długo?”, kafelki z czasem i przycisk „Wstecz”

### Requirement: Czytelność
Tekst MUST mieć kontrast co najmniej 4,5:1 względem tła (WCAG AA), bazowy rozmiar czcionki co najmniej 18 px i interlinię co najmniej 1,5. Elementy dotykowe MUST mieć co najmniej 48×48 px.

#### Scenario: Audyt dostępności
- **WHEN** na kluczowych ekranach zostanie uruchomiony automatyczny audyt dostępności
- **THEN** audyt nie zgłasza błędów kontrastu ani zbyt małych celów dotykowych

### Requirement: Spokojna paleta i tryb ciemny
Interfejs MUST używać ograniczonej palety: ciepłe, jasne tło, ciemny tekst, jeden kolor akcentu (spokojny niebieski) oraz kolory stanu wyłącznie dla komunikatów. Interfejs MUST respektować systemowy tryb ciemny.

#### Scenario: Tryb ciemny
- **WHEN** system operacyjny użytkownika ma włączony tryb ciemny
- **THEN** aplikacja wyświetla ciemne tło i jasny tekst z zachowaniem kontrastu

### Requirement: Brak rozpraszaczy
Interfejs MUST NOT zawierać automatycznie przewijanych karuzel, migających elementów, liczników nieprzeczytanych powiadomień ani reklam. Animacje MUST być wyłączone, gdy użytkownik ustawił preferencję ograniczenia ruchu.

#### Scenario: Ograniczenie ruchu
- **WHEN** użytkownik ma włączone „ogranicz ruch” w systemie
- **THEN** przejścia między ekranami są natychmiastowe, bez animacji

### Requirement: Jasny język
Komunikaty MUST być krótkie, po polsku, w drugiej osobie i bez żargonu. Przyciski MUST opisywać akcję czasownikiem (np. „Szukaj partnera”, a nie „OK”). Komunikaty o błędach MUST mówić, co zrobić dalej.

#### Scenario: Komunikat błędu
- **WHEN** nie udało się połączyć z serwerem
- **THEN** użytkownik widzi komunikat „Nie udało się połączyć. Sprawdź internet i spróbuj ponownie.” z przyciskiem „Spróbuj ponownie”

### Requirement: Widoczny postęp
Wieloetapowe procesy MUST pokazywać, na którym etapie jest użytkownik (np. „Krok 2 z 4”), a oczekiwanie MUST pokazywać, ile już trwa.

#### Scenario: Oczekiwanie na partnera
- **WHEN** użytkownik czeka w kolejce od 40 sekund
- **THEN** ekran oczekiwania pokazuje upływający czas „0:40”
