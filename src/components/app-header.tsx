import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b-2 border-border bg-surface">
      <nav className="mx-auto flex w-full max-w-xl items-center justify-between gap-2 px-4" aria-label="Główna">
        <Link href="/start" className="flex min-h-14 items-center text-lg font-bold text-accent">
          Adehadziaki
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/sesje" className="flex min-h-12 items-center gap-2 rounded-xl px-3 font-bold hover:bg-surface-2">
            <CalendarDays aria-hidden className="size-5" />
            <span>Moje sesje</span>
          </Link>
          <Link
            href="/profil"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-xl px-3 hover:bg-surface-2"
            aria-label="Profil"
          >
            <UserRound aria-hidden className="size-6" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
