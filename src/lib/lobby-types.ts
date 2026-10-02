import type { CallMode } from "./activities";

export type LobbyNowEntry = {
  ticket: string;
  name: string;
  activity: string;
  duration: 25 | 50 | 75;
  mode: CallMode;
  since: string;
};

export type LobbyScheduledEntry = {
  booking_id: string;
  name: string;
  activity: string;
  duration: 25 | 50 | 75;
  mode: CallMode;
  slot_start: string;
};

export type LobbyData = { now: LobbyNowEntry[]; scheduled: LobbyScheduledEntry[] };
