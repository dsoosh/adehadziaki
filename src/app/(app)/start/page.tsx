import type { Metadata } from "next";
import { CalendarClock, Zap } from "lucide-react";
import Link from "next/link";
import { Page } from "@/components/ui/page";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Co robimy?" };

export default async function StartPage() {
  const { profile } = await requireUser("/start");
  return (
    <Page>
      <p className="mb-1 text-muted">Cześć{profile ? `, ${profile.display_name}` : ""}!</p>
      <h1 className="mb-8 text-4xl font-bold">Co robimy?</h1>
      <div className="flex flex-col gap-4">
        <Link
          href="/teraz"
          className="flex min-h-28 items-center gap-5 rounded-3xl bg-accent px-6 py-5 text-accent-text hover:opacity-90"
        >
          <Zap aria-hidden className="size-10 shrink-0" strokeWidth={1.75} />
          <span className="flex flex-col">
            <span className="text-2xl font-bold">Zacznij teraz</span>
            <span>Połączymy Cię z kimś w ciągu kilku minut.</span>
          </span>
        </Link>
        <Link
          href="/zaplanuj"
          className="flex min-h-28 items-center gap-5 rounded-3xl border-2 border-border bg-surface px-6 py-5 hover:border-accent"
        >
          <CalendarClock aria-hidden className="size-10 shrink-0 text-accent" strokeWidth={1.75} />
          <span className="flex flex-col">
            <span className="text-2xl font-bold">Zaplanuj na później</span>
            <span className="text-muted">Umów się na konkretną godzinę.</span>
          </span>
        </Link>
      </div>
    </Page>
  );
}
