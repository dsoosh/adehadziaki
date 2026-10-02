/** Co ile pokój zgłasza obecność (serwer dolicza najwyżej 45 s na zgłoszenie). */
export const HEARTBEAT_MS = 30_000;

/** Wspólny czas, od którego sesja jest odbyta (jak attended_threshold() w bazie). */
export const ATTENDED_MINUTES = 10;

/**
 * Śledzi, czy partner był w pokoju przez cały odcinek od poprzedniego zgłoszenia.
 * `see` wołane przy każdej synchronizacji uczestników, `take` przy zgłoszeniu.
 */
export function createPresenceTracker() {
  let present = false;
  let apart = true;
  return {
    see(partnerPresent: boolean) {
      present = partnerPresent;
      if (!partnerPresent) apart = true;
    },
    /** Czy odcinek od poprzedniego zgłoszenia był w całości wspólny; zaczyna nowy odcinek. */
    take(): boolean {
      const together = present && !apart;
      apart = !present;
      return together;
    },
  };
}

export type WeekStats = { attended: number; minutes: number };
