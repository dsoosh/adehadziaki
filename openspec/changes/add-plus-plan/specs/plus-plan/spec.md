# Spec Delta

## Purpose

Plan płatny „Plus”: porównanie z planem darmowym, wybór pakietu i sposobu płatności (na razie bez pobierania pieniędzy) oraz wyróżnienie osób z planem.

## ADDED Requirements

### Requirement: Porównanie planów
Strona „Plan Plus” MUST pokazywać porównanie planu darmowego i Plus w formie tabeli: sesje w tygodniu (3 × 25 min / bez limitu), czas sesji, lista czekających i rezerwacje, piórko przy nazwie i wsparcie rozwoju. Strona MUST NOT obiecywać funkcji, których aplikacja nie ma. Tabela MUST mieścić się na ekranie o szerokości 360 px bez przewijania w poziomie.

#### Scenario: Wejście z nagłówka
- **WHEN** osoba bez planu dotyka w nagłówku znaczka „Plus” (nazwa dostępna „Przejdź na Plus”)
- **THEN** widzi stronę „Plan Plus” z porównaniem planów

### Requirement: Wybór pakietu i sposobu płatności
Osoba bez planu SHALL móc wybrać pakiet (miesięcznie 29 zł albo rocznie 290 zł – 2 miesiące gratis; domyślnie roczny) i sposób płatności (BLIK, karta płatnicza, szybki przelew). Dopóki płatności nie są podłączone, „Przejdź do płatności” MUST zapisać wybór (pakiet, metoda, osoba, czas) i pokazać informację, że płatności ruszą wkrótce i nic nie zostało pobrane. Zapis MUST być widoczny tylko dla tej osoby.

#### Scenario: Zaślepka płatności
- **WHEN** osoba wybiera „Miesięcznie – 29 zł” i „Karta płatnicza”, a potem „Przejdź do płatności – 29 zł”
- **THEN** widzi „Płatności uruchomimy wkrótce.”, a w bazie jest zapis jej wyboru

### Requirement: Oznaczenie planu
Plan Plus MUST obowiązywać do daty `plus_until`; po niej osoba wraca do planu darmowego. Użytkownik MUST NOT móc sam nadać sobie planu. Osoba z Plus SHALL mieć w nagłówku wypełnioną odznakę „Plus”, a na stronie planu – datę ważności zamiast wyboru pakietu. Przy nazwie osoby z Plus MUST być widoczne piórko (z nazwą dostępną „Plus”) na liście czekających, w karcie partnera w pokoju i w rezerwacjach.

#### Scenario: Piórko na liście czekających
- **WHEN** osoba z aktywnym planem Plus czeka na partnera
- **THEN** inni widzą przy jej nazwie na liście piórko

#### Scenario: Wygaśnięcie planu
- **WHEN** data `plus_until` minęła
- **THEN** piórko i odznaka znikają, a w nagłówku jest znów zachęta „Przejdź na Plus”
