export type ReminderKind = "t10" | "t1";

export type ReminderBooking = { id: string; slot_start: string };

const MINUTE = 60_000;

/**
 * Wybiera przypomnienia do wysłania przy danym ticku (co minutę).
 * t10: od 10 do 2 min przed startem, t1: od 1 min przed startem do startu.
 * Spóźniony tick nadal wysyła, dopóki okno trwa; zbiór `sent` zapewnia idempotencję.
 */
export function pickReminders(
  bookings: ReminderBooking[],
  sent: Set<string>,
  now: Date,
): Array<{ bookingId: string; kind: ReminderKind }> {
  const out: Array<{ bookingId: string; kind: ReminderKind }> = [];
  for (const b of bookings) {
    const left = new Date(b.slot_start).getTime() - now.getTime();
    if (left <= 0) continue;
    let kind: ReminderKind | null = null;
    if (left <= 1.5 * MINUTE) kind = "t1";
    else if (left <= 10.5 * MINUTE && left > 2 * MINUTE) kind = "t10";
    if (kind && !sent.has(`${b.id}:${kind}`)) out.push({ bookingId: b.id, kind });
  }
  return out;
}

export function reminderText(kind: ReminderKind, activityLabel: string, partnerName: string | null): string {
  const when = kind === "t10" ? "Za 10 minut" : "Za minutę";
  return partnerName ? `${when}: ${activityLabel} z ${partnerName}` : `${when}: ${activityLabel}`;
}
