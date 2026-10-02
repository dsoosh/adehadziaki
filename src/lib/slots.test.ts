import { describe, expect, it } from "vitest";
import { formatTime, dayLabel } from "./time";
import { nextSlot, upcomingSlots, groupByDay } from "./slots";

describe("upcomingSlots", () => {
  it("pomija sloty startujące za mniej niż 5 minut", () => {
    // 14:10 czasu warszawskiego (CEST, UTC+2)
    const now = new Date("2026-10-02T12:10:00Z");
    expect(formatTime(upcomingSlots(now)[0])).toBe("14:30");
    // 14:27 → 14:30 jest za blisko, pierwszy slot to 15:00
    expect(formatTime(nextSlot(new Date("2026-10-02T12:27:00Z")))).toBe("15:00");
  });

  it("obejmuje dziś i jutro, ale nie pojutrze", () => {
    const now = new Date("2026-10-02T20:00:00Z"); // 22:00 lokalnie
    const slots = upcomingSlots(now);
    const groups = groupByDay(slots);
    expect(groups.map((g) => g.day)).toEqual(["2026-10-02", "2026-10-03"]);
    expect(formatTime(slots[slots.length - 1])).toBe("23:30");
    expect(groups[1].slots).toHaveLength(48);
  });

  it("wszystkie sloty są o :00 lub :30 czasu lokalnego, także przy zmianie czasu", () => {
    // 25 października 2026 – powrót do czasu zimowego
    const now = new Date("2026-10-24T21:00:00Z"); // 23:00 w sobotę
    for (const s of upcomingSlots(now)) {
      expect(["00", "30"]).toContain(formatTime(s).slice(3));
    }
    const sunday = groupByDay(upcomingSlots(now)).find((g) => g.day === "2026-10-25");
    // Doba 25-godzinna ma 50 półgodzinnych slotów
    expect(sunday?.slots).toHaveLength(50);
  });

  it("opisuje dzień po polsku", () => {
    const now = new Date("2026-10-02T10:00:00Z");
    expect(dayLabel(new Date("2026-10-02T18:00:00Z"), now)).toBe("dziś");
    expect(dayLabel(new Date("2026-10-03T08:00:00Z"), now)).toBe("jutro");
  });
});
