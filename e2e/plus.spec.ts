import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoA11yViolations, signUp, startInstant, supabaseReady } from "./helpers";

test.skip(!supabaseReady, "Wymaga lokalnego Supabase");

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

/** Nazwa unikalna w obrębie przebiegu – po niej znajdujemy profil w bazie. */
const uniqueName = (first: string) =>
  `${first} ${String.fromCharCode(...Array.from({ length: 6 }, () => 97 + Math.floor(Math.random() * 26)))}`;

async function profileId(name: string) {
  const { data } = await admin().from("profiles").select("id").eq("display_name", name).single();
  return data!.id as string;
}

test("osoba bez planu: znaczek w nagłówku prowadzi do porównania i wyboru płatności", async ({ browser }) => {
  const name = uniqueName("Paula");
  const page = await signUp(browser, name);

  // Nagłówek mieści się na wąskim telefonie (360 px)
  await page.setViewportSize({ width: 360, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Przejdź na Plus" }).click();
  await expect(page.getByRole("heading", { name: "Plan Plus" })).toBeVisible();
  const table = page.getByRole("table", { name: "Porównanie planu darmowego i Plus" });
  await expect(table).toContainText("3 × 25 min");
  await expect(table).toContainText("Bez limitu");
  await expectNoA11yViolations(page);

  await expect(page.getByRole("radio", { name: /Rocznie – 290 zł/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: /Miesięcznie – 29 zł/ }).click();
  await page.getByRole("radio", { name: /Karta płatnicza/ }).click();
  await page.getByRole("button", { name: "Przejdź do płatności – 29 zł" }).click();
  await expect(page.getByText("Płatności uruchomimy wkrótce.")).toBeVisible();
  await expectNoA11yViolations(page);

  const { data } = await admin().from("upgrade_intents").select("package, method").eq("user_id", await profileId(name));
  expect(data).toEqual([{ package: "monthly", method: "card" }]);

  // Tryb ciemny też bez błędów dostępności
  await page.getByRole("button", { name: "Włącz tryb ciemny" }).click();
  await expectNoA11yViolations(page);
});

test("osoba z Plus: odznaka w nagłówku i piórko przy nazwie na liście czekających", async ({ browser }) => {
  const name = uniqueName("Olga");
  const olga = await signUp(browser, name);
  const until = new Date(Date.now() + 30 * 24 * 3600_000).toISOString();
  const { error } = await admin().from("profiles").update({ plus_until: until }).eq("id", await profileId(name));
  expect(error).toBeNull();

  await olga.reload();
  await expect(olga.getByRole("link", { name: "Masz plan Plus" })).toBeVisible();
  await olga.getByRole("link", { name: "Masz plan Plus" }).click();
  await expect(olga.getByText("Masz plan Plus")).toBeVisible();
  await expect(olga.getByRole("button", { name: /Przejdź do płatności/ })).toHaveCount(0);

  await startInstant(olga, "Gotowanie", "75");
  await expect(olga.getByRole("heading", { name: /Szukamy kogoś/ })).toBeVisible();

  const guest = await signUp(browser, uniqueName("Gosia"));
  const card = guest.getByRole("link", { name: new RegExp(`^Olga ${name.split(" ")[1][0].toUpperCase()}\\.`) });
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card.getByRole("img", { name: "Plus" })).toBeVisible();
  await expectNoA11yViolations(guest);

  await olga.getByRole("button", { name: "Anuluj" }).click();
});
