import { expect, test } from "@playwright/test";
import { signUp, startInstant, supabaseReady } from "./helpers";

// Zrzuty ekranów do przeglądu UI: SCREENSHOTS=1 npm run test:e2e -- screenshots
test.skip(!process.env.SCREENSHOTS || !supabaseReady, "Tylko na żądanie (SCREENSHOTS=1) z lokalnym Supabase");

for (const scheme of ["light", "dark"] as const) {
  test(`zrzuty ekranów (${scheme})`, async ({ browser }) => {
    const shot = async (page: import("@playwright/test").Page, name: string) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), scheme);
      await page.screenshot({ path: `docs/ui/${scheme}-${name}.png`, fullPage: true });
    };

    const a = await signUp(browser, "Ania Nowak");
    const b = await signUp(browser, "Bartek Zieliński");
    await a.goto("/");
    await shot(a, "01-strona-glowna");
    await startInstant(b, "Spacer", "25", "Tylko głos");
    await a.goto("/start");
    await expect(a.getByRole("link", { name: /Bartek/ })).toBeVisible({ timeout: 10_000 });
    await shot(a, "02-co-robimy");
    await a.goto("/teraz");
    await shot(a, "03-kreator-czynnosc");
    await a.getByRole("radio", { name: "Sprzątanie" }).click();
    await shot(a, "04-kreator-czas");
    await a.getByRole("radio", { name: /^50/ }).click();
    await shot(a, "05-kreator-tryb");
    await a.getByRole("radio", { name: /^Kamera/ }).click();
    await a.getByRole("textbox").fill("Ogarnąć kuchnię i pranie");
    await shot(a, "06-kreator-cel");
    await a.getByRole("button", { name: "Szukaj partnera" }).click();
    await expect(a.getByRole("heading", { name: /Szukamy/ })).toBeVisible();
    await a.waitForTimeout(3000);
    await shot(a, "07-szukanie");

    await startInstant(b, "Praca", "50", "Kamera i głos");
    await expect(a).toHaveURL(/\/sesja\//);
    await shot(a, "08-przed-dolaczeniem");
    await a.getByRole("button", { name: "Dołącz do sesji" }).click();
    await expect(a.getByRole("timer")).toBeVisible();
    await shot(a, "09-pokoj");
    await a.getByRole("button", { name: "Zakończ" }).click();
    await a.getByRole("button", { name: "Tak, zakończ" }).click();
    await a.getByRole("radio", { name: "Udało się" }).click();
    await shot(a, "10-koniec");

    await a.goto("/zaplanuj?activity=spacer&duration=25&mode=audio");
    await shot(a, "11-zaplanuj-cel");
    await a.getByRole("button", { name: "Wybierz godzinę" }).click();
    await shot(a, "12-zaplanuj-godziny");
    await a.goto("/profil");
    await shot(a, "13-profil");
    await a.context().close();
    await b.context().close();
  });
}
