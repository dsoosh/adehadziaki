import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers";

test("strona główna wyjaśnia ideę i prowadzi do rejestracji", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trudno zacząć? Zrób to z kimś.");
  await expect(page.getByRole("link", { name: "Załóż konto" })).toHaveAttribute("href", "/rejestracja");
  await expectNoA11yViolations(page);
});

test("strony prawne są dostępne", async ({ page }) => {
  await page.goto("/regulamin");
  await expect(page.getByRole("heading", { name: "Regulamin" })).toBeVisible();
  await page.goto("/prywatnosc");
  await expect(page.getByRole("heading", { name: "Polityka prywatności" })).toBeVisible();
  await expect(page.getByText("Nie nagrywamy rozmów")).toBeVisible();
});

test("formularz rejestracji wymaga zgody i jest dostępny", async ({ page }) => {
  await page.goto("/rejestracja");
  await expectNoA11yViolations(page);
  await page.getByLabel("Jak mamy Cię nazywać?").fill("Ola");
  await page.getByLabel("E-mail").fill("ola@example.pl");
  await page.getByLabel("Hasło").fill("12345678");
  await page.getByRole("button", { name: "Załóż konto", exact: true }).click();
  await expect(page.getByText("Aby założyć konto, zaakceptuj regulamin")).toBeVisible();
});

test("manifest PWA jest poprawny", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const m = await res.json();
  expect(m.lang).toBe("pl");
  expect(m.display).toBe("standalone");
  expect(m.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icon of m.icons) expect((await request.get(icon.src)).ok()).toBeTruthy();
  expect((await request.get("/sw.js")).ok()).toBeTruthy();
});

test("ekran offline jest po polsku", async ({ page }) => {
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "Brak internetu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spróbuj ponownie" })).toBeVisible();
});

test("domyślnie tryb jasny, przełącznik w pasku zapamiętuje tryb ciemny", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  expect(await theme()).toBe("light");
  expect(await bg()).toBe("rgb(243, 240, 232)");

  await page.getByRole("button", { name: "Włącz tryb ciemny" }).click();
  expect(await theme()).toBe("dark");
  expect(await bg()).toBe("rgb(27, 32, 29)");
  await expectNoA11yViolations(page);

  // Po odświeżeniu tryb jest ustawiony już w HTML, zanim React się załaduje.
  await page.reload({ waitUntil: "commit" });
  await page.waitForSelector("body");
  expect(await theme()).toBe("dark");
  await page.goto("/rejestracja");
  expect(await theme()).toBe("dark");

  await page.goto("/");
  await page.getByRole("button", { name: "Włącz tryb jasny" }).click();
  expect(await theme()).toBe("light");
});
