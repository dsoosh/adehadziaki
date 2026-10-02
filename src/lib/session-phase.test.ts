import { describe, expect, it } from "vitest";
import { canIssueToken, partnerNoShow, roomWindow, sessionPhase } from "./session-phase";
import { formatClock, formatElapsed } from "./time";

const start = new Date("2026-10-02T12:00:00Z");
const end = new Date("2026-10-02T12:50:00Z");
const at = (min: number) => new Date(start.getTime() + min * 60_000);

describe("sessionPhase", () => {
  it("dzieli sesję na powitanie, pracę i podsumowanie", () => {
    expect(sessionPhase(start, end, at(1)).phase).toBe("intro");
    expect(sessionPhase(start, end, at(2)).phase).toBe("work");
    expect(sessionPhase(start, end, at(48.5)).phase).toBe("outro");
    expect(sessionPhase(start, end, at(50)).phase).toBe("done");
    expect(sessionPhase(start, end, at(-1)).phase).toBe("waiting");
  });

  it("licznik pokazuje pozostały czas", () => {
    expect(formatClock(sessionPhase(start, end, at(20)).remainingMs)).toBe("30:00");
    expect(sessionPhase(start, end, at(25)).progress).toBeCloseTo(0.5);
  });

  it("sygnalizuje ostatnie 2 minuty", () => {
    expect(sessionPhase(start, end, at(47.9)).ending).toBe(false);
    expect(sessionPhase(start, end, at(48)).ending).toBe(true);
  });
});

describe("okno pokoju", () => {
  it("otwiera pokój 5 minut przed startem", () => {
    expect(roomWindow(start, end, at(-20))).toBe("too_early");
    expect(roomWindow(start, end, at(-5))).toBe("open");
    expect(roomWindow(start, end, at(50))).toBe("ended");
  });

  it("nie wystawia tokenu po 5 minutach od końca", () => {
    expect(canIssueToken(start, end, at(54))).toBe(true);
    expect(canIssueToken(start, end, at(60))).toBe(false);
    expect(canIssueToken(start, end, at(-6))).toBe(false);
  });

  it("wykrywa nieobecność partnera po 3 minutach", () => {
    expect(partnerNoShow(start, at(2.9), false)).toBe(false);
    expect(partnerNoShow(start, at(3), false)).toBe(true);
    expect(partnerNoShow(start, at(10), true)).toBe(false);
  });
});

describe("formaty czasu", () => {
  it("formatuje licznik oczekiwania", () => {
    expect(formatElapsed(40_000)).toBe("0:40");
    expect(formatElapsed(125_000)).toBe("2:05");
    expect(formatClock(75 * 60_000)).toBe("1:15:00");
  });
});
