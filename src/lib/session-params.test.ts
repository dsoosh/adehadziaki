import { describe, expect, it } from "vitest";
import { choiceFromSearch, choiceToSearch } from "./session-params";

describe("parametry sesji w adresie", () => {
  it("odczytuje tylko poprawne wartości", () => {
    expect(choiceFromSearch({ activity: "spacer", duration: "50", mode: "audio" })).toEqual({
      activity: "spacer",
      duration: 50,
      mode: "audio",
    });
    expect(choiceFromSearch({ activity: "hack", duration: "30", mode: "x" })).toEqual({});
  });
  it("bez kamery zamienia tryb wideo na głos", () => {
    expect(choiceFromSearch({ activity: "praca", duration: "25", mode: "video" }, false).mode).toBe("audio");
    expect(choiceFromSearch({ activity: "praca", duration: "25", mode: "video" }, true).mode).toBe("video");
  });
  it("zapis i odczyt są zgodne", () => {
    const c = { activity: "praca" as const, duration: 25 as const, mode: "video" as const, goal: "Raport" };
    expect(choiceFromSearch(Object.fromEntries(new URLSearchParams(choiceToSearch(c))), true)).toEqual(c);
  });
});
