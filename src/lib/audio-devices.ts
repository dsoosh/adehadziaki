/**
 * Wybór mikrofonu. Chrome na Androidzie kieruje dźwięk rozmowy tam, gdzie jest
 * mikrofon: z mikrofonem telefonu gra przez górny głośniczek (jak przy uchu)
 * i pomija słuchawki Bluetooth. Dlatego, gdy słuchawki są dostępne, wybieramy
 * ich mikrofon.
 */
const HEADSET = /bluetooth|headset|headphone|hands-?free|słuchawk|airpods|buds|\bbt\b/i;

export type MicOption = { deviceId: string; label: string };

export function isHeadsetLabel(label: string): boolean {
  return HEADSET.test(label);
}

export function micOptions(devices: MediaDeviceInfo[]): MicOption[] {
  return devices
    .filter((d) => d.kind === "audioinput" && d.deviceId && d.deviceId !== "communications")
    .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Mikrofon ${i + 1}` }));
}

/** Mikrofon słuchawek do przełączenia albo null, gdy obecny jest już najlepszy. */
export function preferredMic(options: MicOption[], currentId: string | undefined): string | null {
  const current = options.find((o) => o.deviceId === currentId);
  if (current && isHeadsetLabel(current.label)) return null;
  const headset = options.find((o) => isHeadsetLabel(o.label));
  return headset && headset.deviceId !== currentId ? headset.deviceId : null;
}
