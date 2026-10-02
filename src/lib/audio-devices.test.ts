import { describe, expect, it } from "vitest";
import { micOptions, outputKind, preferredMic } from "./audio-devices";

const dev = (deviceId: string, label: string, kind: MediaDeviceKind = "audioinput") =>
  ({ deviceId, label, kind, groupId: "", toJSON: () => ({}) }) as MediaDeviceInfo;

// Tak Chrome na Androidzie nazywa wejścia audio.
const android = [
  dev("default", "Default"),
  dev("speaker", "Speakerphone"),
  dev("earpiece", "Headset earpiece"),
  dev("bt", "Bluetooth headset"),
  dev("cam", "Camera", "videoinput"),
];

describe("wybór miejsca dźwięku", () => {
  it("rozpoznaje rodzaje urządzeń", () => {
    expect(outputKind("Bluetooth headset")).toBe("bluetooth");
    expect(outputKind("Galaxy Buds2 Pro")).toBe("bluetooth");
    expect(outputKind("Headset earpiece")).toBe("phone");
    expect(outputKind("Speakerphone")).toBe("speaker");
    expect(outputKind("Wired headset")).toBe("wired");
    expect(outputKind("Default")).toBe("phone");
  });

  it("kolejność: Bluetooth → telefon przy uchu → głośnik", () => {
    expect(preferredMic(micOptions(android), "default")).toBe("bt");
    expect(preferredMic(micOptions(android), "bt")).toBeNull();
    const noBt = micOptions(android.filter((d) => d.deviceId !== "bt"));
    expect(preferredMic(noBt, "speaker")).toBe("default");
    expect(preferredMic(noBt, "earpiece")).toBeNull();
    expect(preferredMic(micOptions([dev("speaker", "Speakerphone")]), "speaker")).toBeNull();
  });

  it("słuchawki przewodowe przed telefonem", () => {
    const opts = micOptions([dev("default", "Default"), dev("wired", "Wired headset")]);
    expect(preferredMic(opts, "default")).toBe("wired");
  });
});
