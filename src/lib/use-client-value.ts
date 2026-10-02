"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Wartość dostępna tylko w przeglądarce (bez rozjazdu przy hydracji). */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => serverValue);
}
