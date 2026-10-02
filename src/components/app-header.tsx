import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="border-b-2 border-border bg-surface">
      <nav className="mx-auto flex w-full max-w-xl items-center justify-between gap-2 px-4" aria-label="Główna">
        <Link href="/start" className="flex min-h-14 items-center text-lg font-bold whitespace-nowrap text-accent">
          Adehadziaki
        </Link>
        <div className="flex items-center">
          <Link href="/sesje" className="pressable flex min-h-12 items-center gap-2 rounded-xl px-2 font-bold whitespace-nowrap hover:bg-surface-2">
            <CalendarDays aria-hidden className="size-5" />
            <span>Moje sesje</span>
          </Link>
          <ThemeToggle />
          <Link
            href="/profil"
            className="pressable flex min-h-12 min-w-12 items-center justify-center rounded-xl px-2 hover:bg-surface-2"
            aria-label="Profil"
          >
            <UserRound aria-hidden className="size-6" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
