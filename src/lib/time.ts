export const TZ = "Europe/Warsaw";

const timeFmt = new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const longDayFmt = new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });

export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

/** Klucz dnia w strefie Warszawy, np. "2026-10-02". */
export function dayKey(d: Date): string {
  return dayKeyFmt.format(d);
}

/** "dziś", "jutro" albo pełna nazwa dnia. */
export function dayLabel(d: Date, now: Date): string {
  const key = dayKey(d);
  if (key === dayKey(now)) return "dziś";
  if (key === dayKey(new Date(now.getTime() + 24 * 3600_000))) return "jutro";
  return longDayFmt.format(d);
}

/** Format licznika: 05:07 albo 1:02:03. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Krótki licznik oczekiwania: 0:40, 2:05. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
