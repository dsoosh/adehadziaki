import AxeBuilder from "@axe-core/playwright";
import { expect, type Browser, type Page } from "@playwright/test";

export const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.pl`;
}

export async function signUp(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/rejestracja");
  await page.getByLabel("Jak mamy Cię nazywać?").fill(name);
  await page.getByLabel("E-mail").fill(uniqueEmail(name.toLowerCase()));
  await page.getByLabel("Hasło").fill("bardzo-tajne-haslo");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Załóż konto", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Co robimy?" })).toBeVisible();
  return page;
}

export async function startInstant(page: Page, activity: string, duration: string, mode: string) {
  await page.goto("/teraz");
  await page.getByRole("radio", { name: activity }).click();
  await page.getByRole("radio", { name: new RegExp(`^${duration}`) }).click();
  await page.getByRole("radio", { name: new RegExp(`^${mode}`) }).click();
  await page.getByRole("button", { name: "Szukaj partnera" }).click();
}

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
}
