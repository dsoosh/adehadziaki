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
Interfejs MUST używać ograniczonej, stonowanej palety: ciepłe kremowe tło, ciemny (nie czarny) tekst, jeden przygaszony kolor akcentu (szałwiowa zieleń) oraz ziemiste kolory stanu wyłącznie dla komunikatów. Interfejs MUST NOT używać jaskrawych kolorów podstawowych ani neonów.

#### Scenario: Paleta bez jaskrawych kolorów
- **WHEN** użytkownik otwiera dowolny ekran aplikacji
- **THEN** jedynym kolorem akcentu jest przygaszona zieleń, a tekst spełnia kontrast WCAG AA

### Requirement: Przełącznik trybu jasnego i ciemnego
Interfejs MUST domyślnie wyświetlać tryb jasny, niezależnie od ustawień systemu. W pasku nawigacji MUST być przełącznik trybu jasny/ciemny; wybór SHALL być zapamiętany na urządzeniu i zastosowany przy kolejnym wejściu bez mignięcia innego motywu.

#### Scenario: Domyślnie jasny
- **WHEN** nowa osoba otwiera aplikację na urządzeniu z systemowym trybem ciemnym
- **THEN** aplikacja wyświetla się w trybie jasnym

#### Scenario: Zmiana i zapamiętanie trybu
- **WHEN** użytkownik wybiera w pasku „Włącz tryb ciemny” i później ponownie otwiera aplikację
- **THEN** aplikacja od razu wyświetla się w trybie ciemnym, z zachowaniem kontrastu

### Requirement: Brak rozpraszaczy
Interfejs MUST NOT zawierać automatycznie przewijanych karuzel, migających elementów, liczników nieprzeczytanych powiadomień ani reklam. Animacje MUST być wyłączone, gdy użytkownik ustawił preferencję ograniczenia ruchu.

#### Scenario: Ograniczenie ruchu
- **WHEN** użytkownik ma włączone „ogranicz ruch” w systemie
- **THEN** przejścia między ekranami są natychmiastowe, bez animacji

### Requirement: Natychmiastowa reakcja na działanie
Każdy przycisk i kafelek MUST dawać widoczną reakcję w chwili dotknięcia. Przejście do kolejnego ekranu MUST od razu pokazać wskaźnik ładowania (pasek postępu lub ekran „Ładuję…”), a nowy widok SHALL pojawiać się z łagodnym przejściem trwającym nie dłużej niż 250 ms.

#### Scenario: Wolne przejście
- **WHEN** użytkownik dotyka „Moje sesje”, a serwer odpowiada wolno
- **THEN** u góry ekranu od razu pojawia się pasek postępu, a pasek nawigacji pozostaje widoczny

#### Scenario: Wciśnięcie przycisku
- **WHEN** użytkownik przytrzymuje palec na przycisku
- **THEN** przycisk wizualnie się wciska (lekko zmniejsza)

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
