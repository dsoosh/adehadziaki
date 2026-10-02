# Spec Delta

## Purpose

Pozwala zacząć sesję od razu: osoba trafia do kolejki i zostaje losowo połączona z inną osobą, która w tej chwili chce zacząć sesję o tym samym czasie trwania.

## ADDED Requirements

### Requirement: Dołączenie do kolejki
Po zakończeniu kreatora w trybie „Zacznij teraz” system SHALL umieścić użytkownika w kolejce z wybranym czasem trwania, czynnością i trybem. Użytkownik MUST być w kolejce co najwyżej raz.

#### Scenario: Wejście do kolejki
- **WHEN** użytkownik kończy kreator i wybiera „Szukaj partnera”
- **THEN** widzi ekran oczekiwania z komunikatem „Szukamy kogoś do wspólnej sesji…” i przyciskiem „Anuluj”

#### Scenario: Ponowne wejście do kolejki
- **WHEN** użytkownik będący już w kolejce ponownie rozpoczyna szukanie (np. z drugiej karty)
- **THEN** system zastępuje jego poprzedni wpis zamiast tworzyć drugi

### Requirement: Losowe łączenie w pary
System MUST łączyć w parę dwie różne osoby z kolejki o tym samym czasie trwania. Czynności MAY się różnić. Gdy pasujących osób jest kilka, partner SHALL zostać wybrany losowo. Jedna osoba MUST NOT zostać połączona w dwie sesje jednocześnie.

#### Scenario: Dopasowanie
- **WHEN** w kolejce czeka osoba A (50 min, Praca) i dołącza osoba B (50 min, Sprzątanie)
- **THEN** system tworzy dla nich wspólną sesję i obie w ciągu kilku sekund zostają przeniesione do pokoju rozmowy

#### Scenario: Różny czas trwania
- **WHEN** w kolejce czeka osoba A (25 min) i dołącza osoba B (75 min)
- **THEN** system nie łączy ich w parę i obie nadal czekają

#### Scenario: Równoczesne dołączenie
- **WHEN** trzy osoby z tym samym czasem trwania dołączają do kolejki w tej samej chwili
- **THEN** dokładnie dwie z nich zostają połączone, a trzecia nadal czeka

### Requirement: Tryb rozmowy pary
Jeśli choć jedna osoba w parze wybrała „Tylko głos”, sesja MUST odbyć się w trybie audio dla obu stron.

#### Scenario: Mieszane tryby
- **WHEN** łączą się osoba z trybem „Kamera i głos” i osoba z trybem „Tylko głos”
- **THEN** sesja startuje w trybie audio bez obrazu

### Requirement: Wykluczenie zablokowanych osób
System MUST NOT łączyć w parę osób, z których jedna zablokowała drugą.

#### Scenario: Blokada
- **WHEN** osoba A zablokowała osobę B i obie czekają w kolejce na sesję 25 min
- **THEN** system nie łączy ich ze sobą

### Requirement: Anulowanie i limit oczekiwania
Użytkownik SHALL móc w każdej chwili opuścić kolejkę. Po 3 minutach bez dopasowania system MUST usunąć użytkownika z kolejki i zaproponować najbliższy wolny slot do zaplanowania lub ponowne szukanie.

#### Scenario: Anulowanie
- **WHEN** użytkownik na ekranie oczekiwania wybiera „Anuluj”
- **THEN** system usuwa go z kolejki i wraca do ekranu startowego

#### Scenario: Przekroczenie czasu oczekiwania
- **WHEN** użytkownik czeka 3 minuty bez dopasowania
- **THEN** system usuwa go z kolejki i pokazuje komunikat „Tym razem nikogo nie ma” z przyciskami „Szukaj jeszcze raz” i „Zaplanuj na …” z godziną najbliższego slotu
