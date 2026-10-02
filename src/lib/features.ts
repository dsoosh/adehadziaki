import type { CallMode } from "./activities";

/**
 * Kamera w sesjach. Domyślnie wyłączona – wszystkie sesje są głosowe.
 * Zmienna NEXT_PUBLIC_* jest wbudowywana przy buildzie (po zmianie: redeploy).
 */
export const VIDEO_ENABLED = process.env.NEXT_PUBLIC_VIDEO_ENABLED === "true";

/** Tryb, w jakim faktycznie otwieramy pokój. Test admina zawsze może użyć kamery. */
export function effectiveMode(
  mode: CallMode,
  kind: string,
  enabled = VIDEO_ENABLED,
): CallMode {
  return mode === "video" && (enabled || kind === "test") ? "video" : "audio";
}

/** Tryb zapisywany przy nowej sesji: bez kamery zawsze audio. */
export function allowedMode(mode: CallMode, enabled = VIDEO_ENABLED): CallMode {
  return enabled ? mode : "audio";
}
