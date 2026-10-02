# Spec Delta

## Purpose

Pokazuje osoby, które właśnie szukają partnera lub mają zaplanowaną sesję bez partnera, i pozwala dołączyć do konkretnej z nich jednym wyborem – zamiast czekać na losowe dobranie.

## ADDED Requirements

### Requirement: Lista osób czekających
Ekran „Co robimy?” SHALL pokazywać listę „Czekają teraz” (osoby w kolejce „Zacznij teraz”, od najdłużej czekających) oraz „Zaplanowane – szukają partnera” (zaplanowane sesje bez partnera w ciągu 48 godzin). Lista MUST odświeżać się co najwyżej co kilka sekund i MUST NOT zawierać własnych wpisów użytkownika ani osób, z którymi łączy go blokada.

#### Scenario: Ktoś czeka
- **WHEN** Anna czeka w kolejce na sesję „Sprzątanie, 25 min, Tylko głos”
- **THEN** inni użytkownicy widzą na liście „Czekają teraz” kartę „Anna K. · Sprzątanie · 25 min · Tylko głos” z czasem oczekiwania

#### Scenario: Pusta lista
- **WHEN** nikt nie czeka na partnera
- **THEN** lista pokazuje zachętę „Nikt teraz nie czeka. Zacznij sesję – ktoś może dołączyć do Ciebie.”

#### Scenario: Blokada
- **WHEN** Anna zablokowała Bartka
- **THEN** Bartek nie widzi wpisów Anny na liście

### Requirement: Prywatność listy
Lista MUST pokazywać wyłącznie imię i inicjał nazwiska, czynność, czas trwania, tryb rozmowy oraz czas oczekiwania lub godzinę startu. Cel sesji MUST NOT być widoczny na liście – widzi go dopiero połączony partner.

#### Scenario: Cel ukryty
- **WHEN** osoba czekająca wpisała cel „Pismo do urzędu”
- **THEN** cel nie pojawia się na liście, a pojawia się w pokoju po połączeniu

### Requirement: Dołączenie do osoby z listy
Po dotknięciu wpisu system SHALL zapytać tylko „Co Ty będziesz robić?”. Czas trwania i tryb rozmowy MUST zostać przejęte od osoby czekającej. Dla wpisu „teraz” sesja MUST rozpocząć się od razu dla obu osób; dla wpisu zaplanowanego MUST powstać rezerwacja sparowana z tą osobą, a ona SHALL dostać powiadomienie.

#### Scenario: Dołączenie teraz
- **WHEN** Bartek dotyka karty Anny i wybiera „Praca”
- **THEN** Anna i Bartek trafiają do tego samego pokoju, a sesja trwa tyle, ile wybrała Anna

#### Scenario: Dołączenie do zaplanowanej sesji
- **WHEN** Darek dotyka zaplanowanej sesji Celiny o 18:00 i wybiera „Gotowanie”
- **THEN** obie osoby widzą w „Moje sesje” sesję o 18:00 z partnerem

### Requirement: Ktoś był szybszy
Do jednego wpisu MUST dołączyć co najwyżej jedna osoba. Pozostałe osoby, które próbowały dołączyć, MUST zobaczyć komunikat, że ta osoba już znalazła partnera, z możliwością powrotu do listy lub samodzielnego szukania.

#### Scenario: Dwie osoby naraz
- **WHEN** Filip i Gosia jednocześnie dołączają do Ewy
- **THEN** sesję z Ewą rozpoczyna dokładnie jedna z nich, a druga widzi „Ta osoba już znalazła partnera”
