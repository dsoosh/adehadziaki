# Spec Delta

## Purpose

Sprawia, że aplikację można zainstalować na telefonie i komputerze jak zwykłą aplikację oraz otrzymywać przypomnienia, bez publikacji w sklepach.

## ADDED Requirements

### Requirement: Instalowalność
Aplikacja MUST udostępniać manifest z polską nazwą, ikonami (192 i 512 px), kolorem motywu i trybem wyświetlania „standalone”, tak aby przeglądarki oferowały instalację na ekranie głównym.

#### Scenario: Instalacja na Androidzie
- **WHEN** użytkownik otwiera aplikację w Chrome na Androidzie
- **THEN** przeglądarka pozwala zainstalować aplikację, a po instalacji uruchamia się ona bez paska adresu

#### Scenario: Instrukcja dla iOS
- **WHEN** użytkownik otwiera aplikację w Safari na iPhonie i nie ma jej zainstalowanej
- **THEN** w profilu widzi krótką instrukcję „Udostępnij → Do ekranu początkowego”

### Requirement: Działanie bez sieci
Gdy urządzenie jest offline, aplikacja MUST pokazać własny ekran „Brak internetu” po polsku zamiast błędu przeglądarki.

#### Scenario: Offline
- **WHEN** użytkownik otwiera zainstalowaną aplikację bez dostępu do internetu
- **THEN** widzi ekran „Brak internetu – sesje wymagają połączenia” z przyciskiem „Spróbuj ponownie”

### Requirement: Powiadomienia push
Użytkownik SHALL móc włączyć i wyłączyć powiadomienia push w profilu. System MUST prosić o zgodę na powiadomienia dopiero po świadomej akcji użytkownika (np. po pierwszej rezerwacji), nigdy przy pierwszym wejściu.

#### Scenario: Włączenie powiadomień
- **WHEN** użytkownik po pierwszej rezerwacji wybiera „Przypominaj mi”
- **THEN** przeglądarka prosi o zgodę, a po jej udzieleniu system zapisuje subskrypcję

#### Scenario: Brak natrętnych próśb
- **WHEN** nowa osoba po raz pierwszy otwiera aplikację
- **THEN** przeglądarka nie pokazuje prośby o zgodę na powiadomienia
