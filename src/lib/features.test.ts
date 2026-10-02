import { describe, expect, it } from "vitest";
import { allowedMode, effectiveMode } from "./features";
import { modeSuffix, suggestedMode } from "./activities";

describe("flaga kamery", () => {
  it("bez flagi pokój jest głosowy, poza testem admina", () => {
    expect(effectiveMode("video", "instant", false)).toBe("audio");
    expect(effectiveMode("video", "scheduled", false)).toBe("audio");
    expect(effectiveMode("video", "test", false)).toBe("video");
    expect(effectiveMode("audio", "test", false)).toBe("audio");
  });
  it("z flagą zostaje wybrany tryb", () => {
    expect(effectiveMode("video", "instant", true)).toBe("video");
    expect(effectiveMode("audio", "instant", true)).toBe("audio");
  });
  it("nowe sesje bez flagi są głosowe", () => {
    expect(allowedMode("video", false)).toBe("audio");
    expect(allowedMode("video", true)).toBe("video");
    expect(suggestedMode("praca", "video", false)).toBe("audio");
  });
  it("bez flagi opis sesji nie wspomina trybu", () => {
    expect(modeSuffix("audio", false)).toBe("");
    expect(modeSuffix("audio", true)).toBe(" · Tylko głos");
  });
});
