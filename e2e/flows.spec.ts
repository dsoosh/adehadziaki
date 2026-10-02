import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, signUp, startInstant, supabaseReady } from "./helpers";

test.skip(!supabaseReady, "Wymaga lokalnego Supabase (npx supabase start) i zmiennych w .env.local");

test("niezalogowana osoba trafia na logowanie z powrotem na stronę", async ({ page }) => {
  await page.goto("/profil");
  await expect(page).toHaveURL(/\/logowanie\?next=%2Fprofil/);
});

test("dwie osoby łączą się natychmiast, kończą sesję i oceniają ją", async ({ browser }) => {
  const ania = await signUp(browser, "Ania");
  const bartek = await signUp(browser, "Bartek");

  // Kreator: jedno pytanie na ekran, dostępny
  await ania.goto("/teraz");
  await expect(ania.getByText("Krok 1 z 4")).toBeVisible();
  await expectNoA11yViolations(ania);

  await startInstant(ania, "Sprzątanie", "25", "Kamera i głos");
  await expect(ania.getByRole("heading", { name: /Szukamy kogoś/ })).toBeVisible();
  await expectNoA11yViolations(ania);

  await startInstant(bartek, "Praca", "25", "Kamera i głos");

  await expect(ania).toHaveURL(/\/sesja\/[0-9a-f-]+$/);
  await expect(bartek).toHaveURL(/\/sesja\/[0-9a-f-]+$/);
  expect(ania.url()).toBe(bartek.url());

  // Partner widzi nazwę i czynność drugiej osoby
  await expect(bartek.getByText("Ania")).toBeVisible();
  await expect(bartek.getByText("Sprzątanie")).toBeVisible();

  // Dołączenie (bez klucza Daily – tryb demonstracyjny)
  await ania.getByRole("button", { name: "Dołącz do sesji" }).click();
  await expect(ania.getByRole("timer")).toBeVisible();
  await expect(ania.getByText("Powitanie")).toBeVisible();
  await expectNoA11yViolations(ania);

  await ania.getByRole("button", { name: "Zakończ" }).click();
  await ania.getByRole("button", { name: "Tak, zakończ" }).click();
  await expect(ania.getByRole("heading", { name: "Koniec sesji" })).toBeVisible();
  await ania.getByRole("radio", { name: "Udało się" }).click();
  await expect(ania.getByRole("link", { name: "Jeszcze jedna sesja" })).toBeVisible();
  await expectNoA11yViolations(ania);

  // Blokada: po niej nie są łączeni ponownie
  await ania.getByRole("button", { name: "Nie łącz mnie więcej z tą osobą" }).click();
  await expect(ania.getByText("Nie połączymy Cię więcej z: Bartek.")).toBeVisible();

  await startInstant(ania, "Praca", "50", "Tylko głos");
  await startInstant(bartek, "Praca", "50", "Tylko głos");
  await bartek.waitForTimeout(5000);
  await expect(ania.getByRole("heading", { name: /Szukamy kogoś/ })).toBeVisible();
  await expect(bartek.getByRole("heading", { name: /Szukamy kogoś/ })).toBeVisible();
  await ania.getByRole("button", { name: "Anuluj" }).click();
  await bartek.getByRole("button", { name: "Anuluj" }).click();
  await expect(ania.getByRole("heading", { name: "Co robimy?" })).toBeVisible();
});

test("rezerwacja slotu łączy dwie osoby, anulowanie zwalnia partnera", async ({ browser }) => {
  const cela = await signUp(browser, "Celina");
  const darek = await signUp(browser, "Darek");

  // Ostatni slot jutro – nie koliduje z innymi testami
  const lastSlot = async (page: typeof cela) => {
    await page.goto("/zaplanuj");
    await page.getByRole("radio", { name: "Nauka" }).click();
    await page.getByRole("radio", { name: /^75/ }).click();
    await page.getByRole("radio", { name: /^Tylko głos/ }).click();
    await page.getByRole("button", { name: "Wybierz godzinę" }).click();
    await expect(page.getByRole("heading", { name: "Na którą godzinę?" })).toBeVisible();
    return page.getByRole("listitem").getByRole("button").last();
  };

  const slotC = await lastSlot(cela);
  await slotC.click();
  await cela.getByRole("button", { name: "Zarezerwuj" }).click();
  await expect(cela.getByText("Czekamy na partnera")).toBeVisible();

  const slotD = await lastSlot(darek);
  await expect(slotD).toContainText("Ktoś już czeka");
  await slotD.click();
  await darek.getByRole("button", { name: "Zarezerwuj" }).click();
  await expect(darek.getByText("Masz już partnera")).toBeVisible();

  await cela.goto("/sesje");
  await expect(cela.getByText("Masz partnera: Darek")).toBeVisible();
  await expectNoA11yViolations(cela);
  await cela.getByRole("button", { name: "Anuluj rezerwację" }).click();
  await cela.getByRole("button", { name: "Tak, anuluj" }).click();
  await expect(cela.getByText("Nie masz zaplanowanych sesji.")).toBeVisible();

  await darek.goto("/sesje");
  await expect(darek.getByText("Czekamy na partnera")).toBeVisible();
});

test("wylogowanie i ponowne logowanie hasłem z powrotem na żądaną stronę", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `ela-${Date.now()}@test.pl`;
  await page.goto("/rejestracja");
  await page.getByLabel("Jak mamy Cię nazywać?").fill("Ela");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło").fill("bardzo-tajne-haslo");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Załóż konto" }).click();
  await expect(page.getByRole("heading", { name: "Co robimy?" })).toBeVisible();

  await page.goto("/profil");
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Wyloguj się" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trudno zacząć? Zrób to z kimś.");

  await page.goto("/sesje");
  await expect(page).toHaveURL(/\/logowanie\?next=%2Fsesje/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło").fill("zle-haslo-123");
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page.getByText("Nieprawidłowy e-mail lub hasło.")).toBeVisible();
  await page.getByLabel("Hasło").fill("bardzo-tajne-haslo");
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moje sesje" })).toBeVisible();
  await context.close();
});
