import { describe, expect, it } from "vitest";
import { shortName } from "./names";

describe("shortName", () => {
  it("skraca do imienia i inicjału nazwiska", () => {
    expect(shortName("Anna Maria Kowalska")).toBe("Anna K.");
    expect(shortName("bartek nowak")).toBe("bartek N.");
  });
  it("jedno słowo zostaje bez zmian", () => {
    expect(shortName("  Ania ")).toBe("Ania");
  });
  it("pusta nazwa", () => {
    expect(shortName("")).toBe("Partner");
    expect(shortName(null)).toBe("Partner");
  });
});
