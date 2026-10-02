import type { CallMode } from "./activities";

export type SessionSide = { name: string; activity: string; goal: string | null };

type RawSessionSide = Omit<SessionSide, "name"> & { name: string | null };

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

/** Dane z RPC get_session; nazwa może być pusta (np. konto partnera usunięte). */
export type RawSessionDetails = Omit<SessionDetails, "me" | "partner"> & { me: RawSessionSide; partner: RawSessionSide };

/** Uzupełnia brakujące nazwy, żeby UI nigdy nie dostał null. */
export function normalizeSession(raw: RawSessionDetails | null): SessionDetails | null {
  if (!raw) return null;
  return {
    ...raw,
    me: { ...raw.me, name: raw.me.name?.trim() || "Ty" },
    partner: { ...raw.partner, name: raw.partner.name?.trim() || "Partner" },
  };
}
