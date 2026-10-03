import Link from "next/link";
import { CalendarDays, Feather, Sparkles, UserRound } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { isPlus } from "@/lib/plans";
import { supabaseServer } from "@/lib/supabase/server";
import { ThemeToggle } from "./theme-toggle";

/** Czy zalogowana osoba ma plan Plus (nagłówek nie przekierowuje – robią to strony). */
async function currentPlus(): Promise<boolean> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  // Admin ma Plus zawsze (requireUser zapisuje go w bazie – tu nie czekamy na ten zapis).
  if (isAdmin(user.email)) return true;
  const { data } = await supabase.from("profiles").select("plus_until").eq("id", user.id).maybeSingle();
  return isPlus(data?.plus_until);
}

export async function AppHeader() {
  const plus = await currentPlus();
  return (
    <header className="border-b-2 border-border bg-surface">
      <nav className="mx-auto flex w-full max-w-xl items-center justify-between gap-2 px-4" aria-label="Główna">
        <Link href="/start" className="flex min-h-14 items-center text-lg font-bold whitespace-nowrap text-accent">
          Adehadziaki
        </Link>
        <div className="flex items-center">
          <PlanBadge plus={plus} />
          <Link href="/sesje" className="pressable flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl px-2 font-bold whitespace-nowrap hover:bg-surface-2">
            <CalendarDays aria-hidden className="size-5" />
            <span className="max-sm:sr-only">Moje sesje</span>
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

/** Plus: wypełniona odznaka z piórkiem. Darmowy: obrysowana zachęta prowadząca do porównania planów. */
function PlanBadge({ plus }: { plus: boolean }) {
  return (
    <Link
      href="/plus"
      aria-label={plus ? "Masz plan Plus" : "Przejdź na Plus"}
      className="pressable flex min-h-12 items-center rounded-xl px-1"
    >
      {plus ? (
        <span className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-text">
          <Feather aria-hidden className="size-4" strokeWidth={2.25} />
          Plus
        </span>
      ) : (
        <span className="flex items-center gap-1 rounded-full border-2 border-accent px-2.5 py-0.5 text-sm font-bold text-accent hover:bg-accent-soft">
          <Sparkles aria-hidden className="size-4" strokeWidth={2.25} />
          Plus
        </span>
      )}
    </Link>
  );
}
