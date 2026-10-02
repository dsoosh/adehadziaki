import type { CallMode } from "./activities";

export type SessionSide = { name: string; activity: string; goal: string | null };

export type SessionDetails = {
  id: string;
  kind: "instant" | "scheduled";
  duration: 25 | 50 | 75;
  mode: CallMode;
  starts_at: string;
  ends_at: string;
  daily_room: string | null;
  me: SessionSide;
  partner: SessionSide;
  blocked: boolean;
  feedback: "udalo" | "czesciowo" | "nie" | null;
};

export type JoinResponse =
  | { demo: true }
  | { demo: false; url: string; token: string }
  | { error: string };
