import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, signUp, startInstant, supabaseReady } from "./helpers";

test.skip(!supabaseReady, "Wymaga lokalnego Supabase");

test("lista czekających: dołączenie do konkretnej osoby teraz", async ({ browser }) => {
  const anna = await signUp(browser, "Anna Lobbowska");
  const bartek = await signUp(browser, "Bartek Gość");

  await startInstant(anna, "Sprzątanie", "25", "Tylko głos");
  await expect(anna.getByRole("heading", { name: /Szukamy kogoś/ })).toBeVisible();

  await bartek.goto("/start");
  const card = bartek.getByRole("link", { name: /Anna L\./ });
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card).toContainText("Sprzątanie");
  await expect(card).toContainText("25 min");
  await expect(card).toContainText("Tylko głos");
  await expect(bartek.getByText("Lobbowska")).toHaveCount(0);
  await expectNoA11yViolations(bartek);

  await card.click();
  await expect(bartek.getByRole("heading", { name: "Co Ty będziesz robić?" })).toBeVisible();
  await expectNoA11yViolations(bartek);
  await bartek.getByRole("radio", { name: "Praca" }).click();

  await expect(bartek).toHaveURL(/\/sesja\/[0-9a-f-]+$/);
  await expect(anna).toHaveURL(/\/sesja\/[0-9a-f-]+$/);
  expect(bartek.url()).toBe(anna.url());
  await expect(bartek.getByText("Anna L.", { exact: true })).toBeVisible();
  await expect(anna.getByText("Bartek G.", { exact: true })).toBeVisible();
  await expect(anna.getByText("Gość")).toHaveCount(0);
});

test("lista czekających: zapis na zaplanowaną sesję konkretnej osoby", async ({ browser }) => {
  const celina = await signUp(browser, "Celina Planowa");
  const darek = await signUp(browser, "Darek Dołączalski");

  await celina.goto("/zaplanuj");
  await celina.getByRole("radio", { name: "Nauka" }).click();
  // 50 min – inny czas niż w teście rezerwacji, żeby nie połączyć się z jego rezerwacją
  await celina.getByRole("radio", { name: /^50/ }).click();
  await celina.getByRole("radio", { name: /^Tylko głos/ }).click();
  await celina.getByRole("button", { name: "Wybierz godzinę" }).click();
  await celina.getByRole("listitem").getByRole("button").last().click();
  await celina.getByRole("button", { name: "Zarezerwuj" }).click();
  await expect(celina.getByText("Czekamy na partnera")).toBeVisible();

  await darek.goto("/start");
  await expect(darek.getByRole("heading", { name: "Zaplanowane – szukają partnera" })).toBeVisible({ timeout: 10_000 });
  const card = darek.getByRole("link", { name: /Celina P\./ });
  await expect(card).toContainText("Nauka");
  await card.click();
  await darek.getByRole("radio", { name: "Gotowanie" }).click();
  await expect(darek.getByRole("heading", { name: "Zapisane!" })).toBeVisible();

  await darek.goto("/sesje");
  await expect(darek.getByText("Masz partnera: Celina P.")).toBeVisible();
  await celina.goto("/sesje");
  await expect(celina.getByText("Masz partnera: Darek D.")).toBeVisible();
});

test("lista czekających: ktoś był szybszy", async ({ browser }) => {
  const ewa = await signUp(browser, "Ewa Szybka");
  const filip = await signUp(browser, "Filip Pierwszy");
  const gosia = await signUp(browser, "Gosia Druga");

  await startInstant(ewa, "Papierologia", "50", "Kamera i głos");
  await filip.goto("/start");
  await gosia.goto("/start");
  const fCard = filip.getByRole("link", { name: /Ewa S\./ });
  const gCard = gosia.getByRole("link", { name: /Ewa S\./ });
  await expect(fCard).toBeVisible({ timeout: 10_000 });
  await expect(gCard).toBeVisible({ timeout: 10_000 });
  await fCard.click();
  await gCard.click();
  await filip.getByRole("radio", { name: "Praca" }).click();
  await expect(filip).toHaveURL(/\/sesja\//);
  await gosia.getByRole("radio", { name: "Nauka" }).click();
  await expect(gosia.getByRole("heading", { name: "Ta osoba już znalazła partnera" })).toBeVisible();
});
