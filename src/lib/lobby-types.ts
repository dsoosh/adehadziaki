import type { CallMode } from "./activities";

export type LobbyNowEntry = {
  ticket: string;
  name: string;
  /** Ma plan Plus (piórko przy nazwie). */
  plus: boolean;
  activity: string;
  duration: 25 | 50 | 75;
  mode: CallMode;
  since: string;
};

export type LobbyScheduledEntry = {
  booking_id: string;
  name: string;
  /** Ma plan Plus (piórko przy nazwie). */
  plus: boolean;
  activity: string;
  duration: 25 | 50 | 75;
  mode: CallMode;
  slot_start: string;
};

export type LobbyData = { now: LobbyNowEntry[]; scheduled: LobbyScheduledEntry[] };
