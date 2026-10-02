import { describe, expect, it } from "vitest";
import { createPresenceTracker } from "./attendance";

describe("obecność w pokoju", () => {
  it("pierwszy odcinek się nie liczy – nie wiemy, od kiedy partner jest", () => {
    const t = createPresenceTracker();
    t.see(true);
    expect(t.take()).toBe(false);
    t.see(true);
    expect(t.take()).toBe(true);
  });

  it("chwilowe wyjście partnera unieważnia cały odcinek", () => {
    const t = createPresenceTracker();
    t.see(true);
    t.take();
    t.see(false);
    t.see(true);
    expect(t.take()).toBe(false);
    expect(t.take()).toBe(true);
  });

  it("bez partnera nic się nie liczy", () => {
    const t = createPresenceTracker();
    t.see(false);
    expect(t.take()).toBe(false);
    expect(t.take()).toBe(false);
  });
});
