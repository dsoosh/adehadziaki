import { describe, expect, it } from "vitest";
import { isHeadsetLabel, micOptions, preferredMic } from "./audio-devices";

const dev = (deviceId: string, label: string, kind: MediaDeviceKind = "audioinput") =>
  ({ deviceId, label, kind, groupId: "", toJSON: () => ({}) }) as MediaDeviceInfo;

describe("wybór mikrofonu", () => {
  it("rozpoznaje słuchawki", () => {
    expect(isHeadsetLabel("Bluetooth headset")).toBe(true);
    expect(isHeadsetLabel("Galaxy Buds2 Pro")).toBe(true);
    expect(isHeadsetLabel("Słuchawki przewodowe")).toBe(true);
    expect(isHeadsetLabel("Speakerphone")).toBe(false);
    expect(isHeadsetLabel("Built-in microphone")).toBe(false);
  });

  it("wybiera mikrofon słuchawek zamiast wbudowanego", () => {
    const opts = micOptions([
      dev("default", "Default"),
      dev("builtin", "Built-in microphone"),
      dev("bt", "Bluetooth headset"),
      dev("cam", "Camera", "videoinput"),
    ]);
    expect(opts.map((o) => o.deviceId)).toEqual(["default", "builtin", "bt"]);
    expect(preferredMic(opts, "builtin")).toBe("bt");
    expect(preferredMic(opts, "bt")).toBeNull();
  });

  it("bez słuchawek niczego nie zmienia", () => {
    expect(preferredMic(micOptions([dev("builtin", "Built-in microphone")]), "builtin")).toBeNull();
  });
});
