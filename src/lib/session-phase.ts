const MINUTE = 60_000;

export const JOIN_EARLY_MS = 5 * MINUTE;
export const ROOM_GRACE_MS = 5 * MINUTE;
export const INTRO_MS = 2 * MINUTE;
export const OUTRO_MS = 2 * MINUTE;
export const WARNING_MS = 2 * MINUTE;
export const NO_SHOW_MS = 3 * MINUTE;

export type RoomWindow = "too_early" | "open" | "ended";

/** Czy pokój można już otworzyć (od 5 min przed startem do końca sesji). */
export function roomWindow(startsAt: Date, endsAt: Date, now: Date): RoomWindow {
  if (now.getTime() < startsAt.getTime() - JOIN_EARLY_MS) return "too_early";
  if (now.getTime() >= endsAt.getTime()) return "ended";
  return "open";
}

/** Czy wolno wystawić token do pokoju (do końca + 5 min zapasu na reconnect). */
export function canIssueToken(startsAt: Date, endsAt: Date, now: Date): boolean {
  return (
    now.getTime() >= startsAt.getTime() - JOIN_EARLY_MS &&
    now.getTime() < endsAt.getTime() + ROOM_GRACE_MS
  );
}

export type Phase = "waiting" | "intro" | "work" | "outro" | "done";

export type PhaseState = {
  phase: Phase;
  /** Czas do końca sesji (lub do startu, gdy phase = waiting). */
  remainingMs: number;
  /** 0..1 – postęp całej sesji. */
  progress: number;
  /** Ostatnie 2 minuty – pora na sygnał. */
  ending: boolean;
};

export function sessionPhase(startsAt: Date, endsAt: Date, now: Date): PhaseState {
  const start = startsAt.getTime();
  const end = endsAt.getTime();
  const t = now.getTime();
  const total = end - start;

  if (t < start) return { phase: "waiting", remainingMs: start - t, progress: 0, ending: false };
  if (t >= end) return { phase: "done", remainingMs: 0, progress: 1, ending: true };

  const elapsed = t - start;
  const remainingMs = end - t;
  const phase: Phase = elapsed < INTRO_MS ? "intro" : remainingMs <= OUTRO_MS ? "outro" : "work";
  return { phase, remainingMs, progress: elapsed / total, ending: remainingMs <= WARNING_MS };
}

export const PHASE_COPY: Record<Phase, { title: string; hint: string }> = {
  waiting: { title: "Za chwilę zaczynamy", hint: "Pokój otworzy się o czasie startu." },
  intro: { title: "Powitanie", hint: "Powiedzcie sobie, co dziś robicie." },
  work: { title: "Działamy", hint: "Możesz wyciszyć mikrofon. Partner jest obok." },
  outro: { title: "Podsumowanie", hint: "Jak poszło? Powiedzcie, co udało się zrobić." },
  done: { title: "Koniec sesji", hint: "Dobra robota!" },
};

/** Partner się nie pojawił: minęły 3 min od startu i nikt nie dołączył. */
export function partnerNoShow(startsAt: Date, now: Date, partnerEverJoined: boolean): boolean {
  return !partnerEverJoined && now.getTime() - startsAt.getTime() >= NO_SHOW_MS;
}
