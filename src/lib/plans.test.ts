import { describe, expect, it } from "vitest";
import { adminPlusUntil, isPlus, PACKAGES } from "./plans";

describe("plan Plus", () => {
  const now = new Date("2026-10-03T12:00:00Z");
  it("rozpoznaje aktywny plan", () => {
    expect(isPlus(null, now)).toBe(false);
    expect(isPlus("2026-10-01T00:00:00Z", now)).toBe(false);
    expect(isPlus("2026-11-03T00:00:00Z", now)).toBe(true);
  });
  it("administrator dostaje Plus na rok i odnawia go przed wygaśnięciem", () => {
    expect(adminPlusUntil(false, null, now)).toBeNull();
    expect(adminPlusUntil(true, null, now)).toBe("2027-10-03T12:00:00.000Z");
    expect(adminPlusUntil(true, "2027-01-01T00:00:00Z", now)).toBeNull();
    expect(adminPlusUntil(true, "2026-10-20T00:00:00Z", now)).toBe("2027-10-03T12:00:00.000Z");
  });
  it("roczny to 2 miesiące gratis", () => {
    expect(PACKAGES.monthly.price).toBe(29);
    expect(PACKAGES.yearly.price).toBe(290);
  });
});
