import { dayKey } from "./time";

const MINUTE = 60_000;
const SLOT_STEP = 30 * MINUTE;
export const MIN_LEAD_MS = 5 * MINUTE;

/**
 * Sloty startujące o :00 i :30. Warszawa ma przesunięcia o pełne godziny
 * względem UTC, więc siatka 30-minutowa w UTC pokrywa się z siatką lokalną
 * także przy zmianie czasu.
 */
export function upcomingSlots(now: Date, opts: { days?: number } = {}): Date[] {
  const days = opts.days ?? 2;
  const allowedDays = new Set<string>();
  for (let i = 0; i < days; i++) allowedDays.add(dayKey(new Date(now.getTime() + i * 24 * 3600 * 1000)));

  const earliest = now.getTime() + MIN_LEAD_MS;
  let t = Math.ceil(earliest / SLOT_STEP) * SLOT_STEP;
  const result: Date[] = [];
  // Maksymalnie 3 doby kroków – wystarczy z zapasem na dwa dni kalendarzowe.
  for (let i = 0; i < 3 * 48; i++, t += SLOT_STEP) {
    const d = new Date(t);
    if (!allowedDays.has(dayKey(d))) {
      if (result.length > 0) break;
      continue;
    }
    result.push(d);
  }
  return result;
}

export function nextSlot(now: Date): Date {
  return upcomingSlots(now, { days: 2 })[0];
}

export function groupByDay(slots: Date[]): Array<{ day: string; slots: Date[] }> {
  const groups: Array<{ day: string; slots: Date[] }> = [];
  for (const s of slots) {
    const key = dayKey(s);
    const last = groups[groups.length - 1];
    if (last && last.day === key) last.slots.push(s);
    else groups.push({ day: key, slots: [s] });
  }
  return groups;
}
