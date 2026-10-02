import { expect, test } from "@playwright/test";
import { signUp, supabaseReady } from "./helpers";

test.skip(!supabaseReady, "Wymaga lokalnego Supabase");

test("przyciski reagują na wciśnięcie", async ({ browser }) => {
  const page = await signUp(browser, "Iga");
  const btn = page.getByRole("link", { name: /Zacznij teraz/ });
  const box = (await btn.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await expect.poll(() => btn.evaluate((e) => getComputedStyle(e).transform)).toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
  await page.mouse.up();
});

test("ładowanie: prefetch gotowy → ekran ładowania", async ({ browser }) => {
  const page = await signUp(browser, "Ola");
  await page.waitForTimeout(1500); // prefetch linków na ekranie
  await page.route("**/teraz**", async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });
  await page.getByRole("link", { name: /Zacznij teraz/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ładuję" })).toBeVisible({ timeout: 1500 });
  await expect(page.getByRole("link", { name: "Moje sesje" })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByRole("heading", { name: "Co chcesz zrobić?" })).toBeVisible({ timeout: 10000 });
});

test("ładowanie: bez prefetchu → pasek postępu od razu", async ({ browser }) => {
  const page = await signUp(browser, "Ela");
  await page.route("**/sesje**", async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });
  await page.goto("/start"); // świeże wejście – prefetch /sesje też jest opóźniony
  await page.getByRole("link", { name: "Moje sesje" }).click();
  await expect(page.getByRole("progressbar", { name: "Ładowanie" })).toBeVisible({ timeout: 500 });
  await page.waitForTimeout(800);
  await expect(page.getByRole("heading", { name: "Moje sesje" })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("progressbar", { name: "Ładowanie" })).toHaveCount(0);
  expect(await page.locator("main").first().evaluate((e) => getComputedStyle(e).animationName)).toBe("view-in");
});
