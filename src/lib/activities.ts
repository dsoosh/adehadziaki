import {
  BookOpen,
  Briefcase,
  CookingPot,
  FileText,
  Footprints,
  Shovel,
  Sparkles,
  SprayCan,
  type LucideIcon,
} from "lucide-react";
import { VIDEO_ENABLED } from "./features";

export type ActivityId =
  | "praca"
  | "nauka"
  | "sprzatanie"
  | "spacer"
  | "ogrod"
  | "gotowanie"
  | "papiery"
  | "inne";

export type Activity = {
  id: ActivityId;
  label: string;
  /** Czynność w ruchu – wygodniej bez kamery. */
  moving: boolean;
  icon: LucideIcon;
};

export const ACTIVITIES: Activity[] = [
  { id: "praca", label: "Praca", moving: false, icon: Briefcase },
  { id: "nauka", label: "Nauka", moving: false, icon: BookOpen },
  { id: "sprzatanie", label: "Sprzątanie", moving: true, icon: SprayCan },
  { id: "spacer", label: "Spacer", moving: true, icon: Footprints },
  { id: "ogrod", label: "Prace ogrodowe", moving: true, icon: Shovel },
  { id: "gotowanie", label: "Gotowanie", moving: true, icon: CookingPot },
  { id: "papiery", label: "Papierologia", moving: false, icon: FileText },
  { id: "inne", label: "Coś innego", moving: false, icon: Sparkles },
];

export function getActivity(id: string): Activity {
  return ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[ACTIVITIES.length - 1];
}

export function isActivityId(value: unknown): value is ActivityId {
  return typeof value === "string" && ACTIVITIES.some((a) => a.id === value);
}

export const DURATIONS = [25, 50, 75] as const;
export type Duration = (typeof DURATIONS)[number];

export function isDuration(value: unknown): value is Duration {
  return DURATIONS.includes(value as Duration);
}

export type CallMode = "video" | "audio";

export const MODE_LABELS: Record<CallMode, string> = {
  video: "Kamera i głos",
  audio: "Tylko głos",
};

/** Tryb wstępnie zaznaczony w kreatorze: w ruchu audio, inaczej domyślny z profilu. */
export function suggestedMode(activity: ActivityId, profileDefault: CallMode, videoEnabled = VIDEO_ENABLED): CallMode {
  if (!videoEnabled) return "audio";
  return getActivity(activity).moving ? "audio" : profileDefault;
}

/** Dopisek „ · Tylko głos” do opisu sesji – tylko gdy w ogóle jest wybór trybu. */
export function modeSuffix(mode: CallMode, videoEnabled = VIDEO_ENABLED): string {
  return videoEnabled ? ` · ${MODE_LABELS[mode]}` : "";
}
