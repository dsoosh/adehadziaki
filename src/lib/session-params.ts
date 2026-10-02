import { isActivityId, isDuration, type ActivityId, type CallMode, type Duration } from "./activities";

export type SessionChoice = {
  activity: ActivityId;
  duration: Duration;
  mode: CallMode;
  goal: string;
};

/** Odczytuje wybory przekazane w adresie (np. „Jeszcze jedna sesja”). */
export function choiceFromSearch(sp: Record<string, string | string[] | undefined>): Partial<SessionChoice> {
  const out: Partial<SessionChoice> = {};
  if (isActivityId(sp.activity)) out.activity = sp.activity;
  const d = Number(sp.duration);
  if (isDuration(d)) out.duration = d;
  if (sp.mode === "video" || sp.mode === "audio") out.mode = sp.mode;
  if (typeof sp.goal === "string") out.goal = sp.goal.slice(0, 120);
  return out;
}

export function choiceToSearch(c: Partial<SessionChoice>): string {
  const p = new URLSearchParams();
  if (c.activity) p.set("activity", c.activity);
  if (c.duration) p.set("duration", String(c.duration));
  if (c.mode) p.set("mode", c.mode);
  if (c.goal) p.set("goal", c.goal);
  return p.toString();
}
