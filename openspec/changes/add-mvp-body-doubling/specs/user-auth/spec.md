# Spec Delta

## Purpose

Pozwala osobie założyć konto, zalogować się i bezpiecznie korzystać z aplikacji, tak aby sesje body doublingu były przypisane do konkretnych, zweryfikowanych użytkowników.

## ADDED Requirements

### Requirement: Rejestracja e-mailem i hasłem
System SHALL umożliwić założenie konta podając adres e-mail, hasło (min. 8 znaków) i nazwę wyświetlaną. Rejestracja MUST wymagać zaznaczenia zgody na regulamin i politykę prywatności. Konto MUST zostać aktywowane dopiero po kliknięciu linku potwierdzającego wysłanego e-mailem.

#### Scenario: Poprawna rejestracja
- **WHEN** osoba podaje poprawny e-mail, hasło o długości co najmniej 8 znaków, nazwę wyświetlaną i zaznacza zgodę
- **THEN** system tworzy konto i pokazuje komunikat „Sprawdź skrzynkę – wysłaliśmy link potwierdzający”

#### Scenario: Brak zgody na regulamin
- **WHEN** osoba próbuje się zarejestrować bez zaznaczenia zgody
- **THEN** system nie tworzy konta i pokazuje przy polu zgody komunikat, że zgoda jest wymagana

#### Scenario: E-mail już zajęty
- **WHEN** osoba podaje e-mail, dla którego istnieje konto
- **THEN** system nie ujawnia, czy konto istnieje, i pokazuje ten sam komunikat co przy poprawnej rejestracji

### Requirement: Logowanie
System SHALL umożliwić logowanie e-mailem i hasłem, jednorazowym linkiem wysłanym e-mailem (link magiczny) oraz kontem Google. Po zalogowaniu użytkownik MUST trafić na ekran startowy aplikacji.

#### Scenario: Logowanie hasłem
- **WHEN** użytkownik podaje poprawny e-mail i hasło
- **THEN** system loguje go i przekierowuje na ekran „Co robimy?”

#### Scenario: Błędne dane logowania
- **WHEN** użytkownik podaje niepoprawne hasło
- **THEN** system pokazuje komunikat „Nieprawidłowy e-mail lub hasło” bez wskazywania, które pole jest błędne

#### Scenario: Logowanie linkiem magicznym
- **WHEN** użytkownik prosi o link logowania i otwiera go z e-maila
- **THEN** system loguje go bez podawania hasła

### Requirement: Ochrona stron aplikacji
Strony wymagające konta MUST być niedostępne dla niezalogowanych osób, które SHALL zostać przekierowane do logowania, a po zalogowaniu wrócić na żądaną stronę.

#### Scenario: Wejście bez logowania
- **WHEN** niezalogowana osoba otwiera adres strony sesji lub profilu
- **THEN** system przekierowuje ją na stronę logowania, a po zalogowaniu z powrotem na żądaną stronę

### Requirement: Reset hasła
System SHALL umożliwić ustawienie nowego hasła za pomocą linku wysłanego na e-mail konta.

#### Scenario: Ustawienie nowego hasła
- **WHEN** użytkownik prosi o reset hasła, otwiera link z e-maila i podaje nowe hasło
- **THEN** system zmienia hasło i loguje użytkownika

### Requirement: Wylogowanie
System SHALL umożliwić wylogowanie z każdego ekranu aplikacji poprzez profil.

#### Scenario: Wylogowanie
- **WHEN** zalogowany użytkownik wybiera „Wyloguj się”
- **THEN** system kończy sesję logowania i pokazuje stronę główną
