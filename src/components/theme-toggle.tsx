"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_COLORS, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme-mode";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const read = (): ThemeMode => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, read, () => "light" as ThemeMode);
  const next: ThemeMode = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[next]);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
          // bez zapamiętania – wybór działa do odświeżenia strony
        }
      }}
      aria-label={next === "dark" ? "Włącz tryb ciemny" : "Włącz tryb jasny"}
      title={next === "dark" ? "Tryb ciemny" : "Tryb jasny"}
      className="pressable flex min-h-12 min-w-12 items-center justify-center rounded-xl px-2 hover:bg-surface-2"
    >
      {mode === "dark" ? <Sun aria-hidden className="size-6" /> : <Moon aria-hidden className="size-6" />}
    </button>
  );
}
