import { describe, expect, it } from "vitest";
import { isAdmin } from "./admin";

describe("isAdmin", () => {
  it("rozpoznaje e-mail z listy bez względu na wielkość liter i spacje", () => {
    expect(isAdmin("Ola@Example.pl", " ola@example.pl , jan@example.pl")).toBe(true);
    expect(isAdmin("jan@example.pl", "ola@example.pl,jan@example.pl")).toBe(true);
  });
  it("odrzuca spoza listy, pustą listę i brak e-maila", () => {
    expect(isAdmin("ktos@example.pl", "ola@example.pl")).toBe(false);
    expect(isAdmin("ola@example.pl", "")).toBe(false);
    expect(isAdmin(null, "ola@example.pl")).toBe(false);
  });
});
