/**
 * Wybór mikrofonu = wybór miejsca, z którego słychać partnera. Chrome na
 * Androidzie kieruje dźwięk rozmowy tam, gdzie jest mikrofon (np. „Bluetooth
 * headset” → słuchawki BT, „Headset earpiece” → telefon przy uchu,
 * „Speakerphone” → głośnik). Kolejność: Bluetooth, słuchawki przewodowe,
 * telefon przy uchu, głośnik telefonu.
 */
export type OutputKind = "bluetooth" | "wired" | "phone" | "speaker";

export type MicOption = { deviceId: string; label: string; kind: OutputKind };

const RANK: Record<OutputKind, number> = { bluetooth: 0, wired: 1, phone: 2, speaker: 3 };

export const OUTPUT_LABELS: Record<OutputKind, string> = {
  bluetooth: "Słuchawki Bluetooth",
  wired: "Słuchawki przewodowe",
  phone: "Telefon (przy uchu)",
  speaker: "Głośnik telefonu",
};

export function outputKind(label: string): OutputKind {
  const l = label.toLowerCase();
  if (/bluetooth|airpods|buds|\bbt\b|hands-?free/.test(l)) return "bluetooth";
  if (/earpiece/.test(l)) return "phone";
  if (/speakerphone|speaker|głośnik/.test(l)) return "speaker";
  if (/headset|headphone|wired|słuchawk|usb audio/.test(l)) return "wired";
  return "phone";
}

export function micOptions(devices: MediaDeviceInfo[]): MicOption[] {
  return devices
    .filter((d) => d.kind === "audioinput" && d.deviceId && d.deviceId !== "communications")
    .map((d, i) => {
      const label = d.label || `Mikrofon ${i + 1}`;
      return { deviceId: d.deviceId, label, kind: outputKind(label) };
    });
}

/** Najlepsze dostępne urządzenie albo null, gdy obecne jest już najlepsze. */
export function preferredMic(options: MicOption[], currentId: string | undefined): string | null {
  if (options.length === 0) return null;
  const best = [...options].sort((a, b) => RANK[a.kind] - RANK[b.kind])[0];
  const current = options.find((o) => o.deviceId === currentId);
  if (current && RANK[current.kind] <= RANK[best.kind]) return null;
  return best.deviceId === currentId ? null : best.deviceId;
}
