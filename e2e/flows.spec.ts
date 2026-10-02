import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
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
  await page.getByRole("button", { name: "Załóż konto", exact: true }).click();
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

test("konto z Google bez zgody musi przejść ekran powitalny", async ({ browser }) => {
  // Tak wygląda konto po pierwszym logowaniu Google: brak zgody w metadanych.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const email = `google-${Date.now()}@test.pl`;
  const { error } = await admin.auth.admin.createUser({
    email,
    password: "bardzo-tajne-haslo",
    email_confirm: true,
    user_metadata: { full_name: "Gosia Kowalska", given_name: "Gosia" },
  });
  expect(error).toBeNull();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/rejestracja");
  await expect(page.getByRole("button", { name: "Załóż konto przez Google" })).toBeVisible();

  await page.goto("/logowanie");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło").fill("bardzo-tajne-haslo");
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await expect(page).toHaveURL(/\/witaj\?next=%2Fstart/);
  await expect(page.getByLabel("Jak mamy Cię nazywać?")).toHaveValue("Gosia");
  await expectNoA11yViolations(page);

  // Bez zgody nie da się wejść do aplikacji
  await page.goto("/teraz");
  await expect(page).toHaveURL(/\/witaj\?next=%2Fteraz/);
  await page.getByRole("button", { name: "Zaczynamy" }).click();
  await expect(page.getByText("Aby korzystać z aplikacji, zaakceptuj regulamin")).toBeVisible();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Zaczynamy" }).click();
  await expect(page.getByRole("heading", { name: "Co chcesz zrobić?" })).toBeVisible();
  await page.goto("/start");
  await expect(page.getByRole("heading", { name: "Co robimy?" })).toBeVisible();
  await expect(page.getByText("Cześć, Gosia!")).toBeVisible();
  await context.close();
});

test("pokój działa bez profilu partnera i zwalnia mikrofon po zakończeniu", async ({ browser }) => {
  const ania = await signUp(browser, "Ania");
  const bartek = await signUp(browser, "Bartek");

  // Zapamiętujemy wszystkie strumienie z kamery/mikrofonu, żeby sprawdzić ich zwolnienie.
  await ania.addInitScript(() => {
    const w = window as unknown as { __streams: MediaStream[] };
    w.__streams = [];
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (c) => {
      const s = await original(c);
      w.__streams.push(s);
      return s;
    };
  });

  await startInstant(ania, "Nauka", "25", "Kamera i głos");
  await startInstant(bartek, "Nauka", "25", "Kamera i głos");
  await expect(ania).toHaveURL(/\/sesja\/[0-9a-f-]+$/);

  // Partner bez profilu (np. konto sprzed migracji lub usunięte).
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { error } = await admin.from("profiles").delete().eq("display_name", "Bartek");
  expect(error).toBeNull();
  await ania.reload();

  await expect(ania.getByText("Partner", { exact: true }).first()).toBeVisible();
  await ania.getByRole("button", { name: "Dołącz do sesji" }).click();
  await expect(ania.getByRole("timer")).toBeVisible();

  const liveTracks = () =>
    ania.evaluate(() =>
      (window as unknown as { __streams: MediaStream[] }).__streams
        .flatMap((s) => s.getTracks())
        .filter((t) => t.readyState === "live").length,
    );
  expect(await liveTracks()).toBeGreaterThan(0);

  // Wyjście z pokoju w trakcie rozmowy (nawigacja w aplikacji) też musi zwolnić urządzenia.
  await ania.getByRole("link", { name: "Moje sesje" }).click();
  await expect(ania.getByRole("heading", { name: "Moje sesje" })).toBeVisible();
  await expect.poll(liveTracks).toBe(0);

  // …i tak samo zwykłe zakończenie sesji.
  await ania.goBack();
  await ania.getByRole("button", { name: "Dołącz do sesji" }).click();
  await expect(ania.getByRole("timer")).toBeVisible();
  expect(await liveTracks()).toBeGreaterThan(0);
  await ania.getByRole("button", { name: "Zakończ" }).click();
  await ania.getByRole("button", { name: "Tak, zakończ" }).click();
  await expect(ania.getByRole("heading", { name: "Koniec sesji" })).toBeVisible();
  await expect.poll(liveTracks).toBe(0);
});

test("pokój: wybór, gdzie słychać partnera, przełącza mikrofon w trakcie rozmowy", async ({ browser }) => {
  const hela = await signUp(browser, "Hela");
  const igor = await signUp(browser, "Igor");
  await startInstant(hela, "Gotowanie", "25", "Tylko głos");
  await startInstant(igor, "Gotowanie", "25", "Tylko głos");
  await expect(hela).toHaveURL(/\/sesja\/[0-9a-f-]+$/);

  await hela.getByRole("button", { name: "Dołącz do sesji" }).click();
  await expect(hela.getByRole("timer")).toBeVisible();
  await expect(hela.getByRole("slider")).toHaveCount(0);

  await hela.getByRole("button", { name: "Gdzie słychać partnera?" }).click();
  const options = hela.getByRole("radiogroup", { name: "Gdzie słychać partnera" }).getByRole("radio");
  expect(await options.count()).toBeGreaterThan(1);
  await options.nth(1).click();
  await expect(options.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(hela.getByRole("timer")).toBeVisible();
  await expect(hela.getByText("Nie udało się przełączyć mikrofonu")).toHaveCount(0);
  await expectNoA11yViolations(hela);
});
