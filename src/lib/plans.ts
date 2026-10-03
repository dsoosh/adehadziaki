/** Plan płatny „Plus”. Płatności nie są jeszcze podłączone – strona /plus zapisuje tylko zainteresowanie. */

export function isPlus(plusUntil: string | null | undefined, now = new Date()): boolean {
  return Boolean(plusUntil) && new Date(plusUntil!).getTime() > now.getTime();
}

export type PlanPackage = "monthly" | "yearly";
export type PaymentMethod = "blik" | "card" | "transfer";

export const MONTHLY_PRICE = 29;

export const PACKAGES: Record<PlanPackage, { label: string; price: number; per: string; note?: string }> = {
  monthly: { label: "Miesięcznie", price: MONTHLY_PRICE, per: "zł / miesiąc" },
  // 12 × 29 zł = 348 zł; dwa miesiące gratis → 10 × 29 zł.
  yearly: { label: "Rocznie", price: MONTHLY_PRICE * 10, per: "zł / rok", note: "2 miesiące gratis" },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; description: string }> = {
  blik: { label: "BLIK", description: "Kod z aplikacji banku" },
  card: { label: "Karta płatnicza", description: "Visa, Mastercard, Apple Pay, Google Pay" },
  transfer: { label: "Szybki przelew", description: "Przelew z Twojego banku" },
};

/** Porównanie planów: [cecha, darmowy, Plus]; true/false rysujemy jako ikonę. */
export const COMPARISON: Array<[string, string | boolean, string | boolean]> = [
  ["Sesje w tygodniu", "3 × 25 min", "Bez limitu"],
  ["Czas sesji", "25 min", "25, 50 lub 75 min"],
  ["Lista czekających i rezerwacje", true, true],
  ["Piórko przy Twojej nazwie", false, true],
  ["Wspierasz rozwój aplikacji", false, true],
];
