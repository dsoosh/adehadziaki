import { describe, expect, it, vi } from "vitest";
import { NETWORK_ERROR, SERVER_ERROR, toUserMessage } from "./errors";

describe("toUserMessage", () => {
  it("tłumaczy znane kody z bazy", () => {
    expect(toUserMessage({ message: "booking_conflict", code: "P0001" })).toContain("masz już sesję");
  });

  it("odróżnia błąd serwera od braku internetu", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toUserMessage({ message: "Could not find the function public.instant_join", code: "PGRST202" })).toBe(SERVER_ERROR);
    expect(toUserMessage({ message: "TypeError: Failed to fetch", code: "" })).toBe(NETWORK_ERROR);
    expect(toUserMessage(null)).toBe(NETWORK_ERROR);
  });
});
