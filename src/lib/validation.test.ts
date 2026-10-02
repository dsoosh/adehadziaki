import { describe, expect, it } from "vitest";
import { validateDisplayName, validateEmail, validatePassword } from "./validation";

describe("walidacja", () => {
  it("nazwa wyświetlana 2–30 znaków", () => {
    expect(validateDisplayName("A")).not.toBeNull();
    expect(validateDisplayName("  Ola ")).toBeNull();
    expect(validateDisplayName("x".repeat(31))).not.toBeNull();
  });
  it("hasło co najmniej 8 znaków", () => {
    expect(validatePassword("1234567")).not.toBeNull();
    expect(validatePassword("12345678")).toBeNull();
  });
  it("e-mail", () => {
    expect(validateEmail("ola@example.pl")).toBeNull();
    expect(validateEmail("ola@")).not.toBeNull();
  });
});
