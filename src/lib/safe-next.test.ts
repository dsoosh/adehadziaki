import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("przepuszcza ścieżki w aplikacji", () => {
    expect(safeNext("/sesja/abc")).toBe("/sesja/abc");
  });
  it("odrzuca adresy zewnętrzne", () => {
    expect(safeNext("https://zly.pl")).toBe("/start");
    expect(safeNext("//zly.pl")).toBe("/start");
    expect(safeNext("/\\zly.pl")).toBe("/start");
    expect(safeNext(null)).toBe("/start");
  });
});
