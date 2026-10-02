import { describe, expect, it } from "vitest";
import { pickReminders, reminderText } from "./reminders";

const now = new Date("2026-10-02T12:00:00Z");
const inMin = (m: number) => new Date(now.getTime() + m * 60_000).toISOString();

describe("pickReminders", () => {
  it("wysyła T-10 i T-1 w odpowiednich oknach", () => {
    const res = pickReminders(
      [
        { id: "a", slot_start: inMin(10) },
        { id: "b", slot_start: inMin(1) },
        { id: "c", slot_start: inMin(30) },
        { id: "d", slot_start: inMin(-1) },
      ],
      new Set(),
      now,
    );
    expect(res).toEqual([
      { bookingId: "a", kind: "t10" },
      { bookingId: "b", kind: "t1" },
    ]);
  });

  it("nie wysyła ponownie tego samego przypomnienia", () => {
    expect(pickReminders([{ id: "a", slot_start: inMin(9) }], new Set(["a:t10"]), now)).toEqual([]);
  });

  it("buduje treść z imieniem partnera", () => {
    expect(reminderText("t10", "Sprzątanie", "Kasia")).toBe("Za 10 minut: Sprzątanie z Kasia");
  });
});
