import { describe, expect, it } from "vitest";
import { publicOrigin } from "./public-origin";

const internal = "https://0.0.0.0:8080";

describe("publicOrigin", () => {
  it("używa NEXT_PUBLIC_SITE_URL, gdy jest ustawiony", () => {
    expect(publicOrigin(new Headers(), internal, "https://adehadziaki.pl/")).toBe("https://adehadziaki.pl");
  });

  it("bez konfiguracji bierze adres z nagłówków proxy", () => {
    const h = new Headers({ "x-forwarded-host": "app.up.railway.app", "x-forwarded-proto": "https", host: "0.0.0.0:8080" });
    expect(publicOrigin(h, internal, "")).toBe("https://app.up.railway.app");
  });

  it("nigdy nie zwraca adresu 0.0.0.0 z nagłówka Host, jeśli ma coś lepszego", () => {
    expect(publicOrigin(new Headers({ host: "0.0.0.0:8080" }), "http://localhost:3000", "")).toBe("http://localhost:3000");
  });
});
