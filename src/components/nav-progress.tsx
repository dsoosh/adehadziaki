"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Cienki pasek postępu u góry ekranu: rusza w chwili kliknięcia linku w aplikacji
 * i znika, gdy zmieni się ścieżka. Daje natychmiastową odpowiedź także wtedy, gdy
 * kolejny widok nie zdążył się wcześniej pobrać (wolny internet).
 */
export function NavProgress() {
  const pathname = usePathname();
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setPendingFrom(window.location.pathname);
      clearTimeout(timeout);
      // Zabezpieczenie, gdyby nawigacja się nie odbyła (np. przekierowanie z powrotem).
      timeout = setTimeout(() => setPendingFrom(null), 10_000);
    }
    // Faza przechwytywania: <Link> wywołuje preventDefault() w handlerze Reacta,
    // więc w zwykłej fazie bąbelkowania kliknięcie wyglądałoby na „obsłużone”.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(timeout);
    };
  }, []);

  if (pendingFrom === null || pendingFrom !== pathname) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1" role="progressbar" aria-label="Ładowanie">
      <div className="h-full animate-nav-progress rounded-r-full bg-accent" />
    </div>
  );
}
