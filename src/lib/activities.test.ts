import { describe, expect, it } from "vitest";
import { ACTIVITIES, suggestedMode } from "./activities";

describe("activities", () => {
  it("ma 8 czynności z polskimi podpisami", () => {
    expect(ACTIVITIES.map((a) => a.label)).toEqual([
      "Praca", "Nauka", "Sprzątanie", "Spacer", "Prace ogrodowe", "Gotowanie", "Papierologia", "Coś innego",
    ]);
  });

  it("dla czynności w ruchu sugeruje tylko głos", () => {
    expect(suggestedMode("spacer", "video")).toBe("audio");
    expect(suggestedMode("ogrod", "video")).toBe("audio");
    expect(suggestedMode("praca", "video")).toBe("video");
    expect(suggestedMode("praca", "audio")).toBe("audio");
  });
});
