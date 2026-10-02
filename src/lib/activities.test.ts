import { describe, expect, it } from "vitest";
import { ACTIVITIES, suggestedMode } from "./activities";

describe("activities", () => {
  it("ma 8 czynności z polskimi podpisami", () => {
    expect(ACTIVITIES.map((a) => a.label)).toEqual([
      "Praca", "Nauka", "Sprzątanie", "Spacer", "Prace ogrodowe", "Gotowanie", "Papierologia", "Coś innego",
    ]);
  });

  it("dla czynności w ruchu sugeruje tylko głos", () => {
    expect(suggestedMode("spacer", "video", true)).toBe("audio");
    expect(suggestedMode("ogrod", "video", true)).toBe("audio");
    expect(suggestedMode("praca", "video", true)).toBe("video");
    expect(suggestedMode("praca", "audio", true)).toBe("audio");
  });
});
