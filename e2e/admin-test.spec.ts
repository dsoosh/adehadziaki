import { expect, test, type Browser } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoA11yViolations, signUp, supabaseReady } from "./helpers";

test.skip(!supabaseReady, "Wymaga lokalnego Supabase");

const ADMIN = { email: "admin.e2e@test.pl", password: "bardzo-tajne-haslo" };

async function loginAdmin(browser: Browser) {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  // Konto może już istnieć z poprzedniego przebiegu.
  await admin.auth.admin.createUser({
    ...ADMIN,
    email_confirm: true,
    user_metadata: { display_name: "Admin Testowy", accepted_terms_at: new Date().toISOString() },
  });
  const page = await (await browser.newContext()).newPage();
  await page.goto("/logowanie?next=/profil");
  await page.getByLabel("E-mail").fill(ADMIN.email);
  await page.getByLabel("Hasło").fill(ADMIN.password);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();
  return page;
}

test("admin uruchamia sesję testową i dołącza z dwóch urządzeń", async ({ browser }) => {
  const desktop = await loginAdmin(browser);
  await expect(desktop.getByRole("heading", { name: "Test połączenia" })).toBeVisible();
  await expectNoA11yViolations(desktop);

  await desktop.getByRole("button", { name: "Test głosowy" }).click();
  await expect(desktop).toHaveURL(/\/sesja\/[0-9a-f-]+$/);
  await expect(desktop.getByText("Sesja testowa.")).toBeVisible();
  await expect(desktop.getByRole("button", { name: "Kopiuj link" })).toBeVisible();
  const url = desktop.url();

  await desktop.getByRole("button", { name: "Dołącz do sesji" }).click();
  await expect(desktop.getByRole("timer")).toBeVisible();
  await expect(desktop.getByText("Zgłoś problem")).toHaveCount(0);
  await expectNoA11yViolations(desktop);

  // „Drugie urządzenie” – to samo konto, ten sam link.
  const phone = await loginAdmin(browser);
  await phone.goto(url);
  await expect(phone.getByText("To nie jest Twoja sesja")).toHaveCount(0);
  await phone.getByRole("button", { name: "Dołącz do sesji" }).click();
  await expect(phone.getByRole("timer")).toBeVisible();
});

test("zwykły użytkownik nie ma testu połączenia", async ({ browser }) => {
  const page = await signUp(browser, "Zwykła Osoba");
  await page.goto("/profil");
  await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Test połączenia" })).toHaveCount(0);
});
