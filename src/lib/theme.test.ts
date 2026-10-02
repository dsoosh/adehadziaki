import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { THEME, contrast } from "./theme";

describe("paleta", () => {
  for (const [mode, t] of Object.entries(THEME)) {
    it(`tekst ma kontrast co najmniej 4.5:1 (${mode})`, () => {
      for (const bg of [t.bg, t.surface, t.surface2, t.accentSoft]) {
        expect(contrast(t.text, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.muted, bg)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(t.accentText, t.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.accent, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.success, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.warning, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.danger, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.danger, t.dangerSoft)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("jest zgodna z tokenami w globals.css", () => {
    const css = readFileSync(path.join(__dirname, "../app/globals.css"), "utf8");
    for (const t of Object.values(THEME)) {
      for (const hex of Object.values(t)) expect(css).toContain(hex);
    }
  });
});
