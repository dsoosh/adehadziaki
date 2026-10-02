import type { Metadata } from "next";
import { connection } from "next/server";
import { BookingList, type BookingRow } from "@/components/session/booking-list";
import { ButtonLink } from "@/components/ui/button";
import { Page } from "@/components/ui/page";
import { requireUser } from "@/lib/supabase/server";
import type { WeekStats } from "@/lib/attendance";

export const metadata: Metadata = { title: "Moje sesje" };

export default async function MySessionsPage() {
  await connection();
  const { supabase } = await requireUser("/sesje");
  const [{ data }, { data: statsData }] = await Promise.all([
    supabase.rpc("my_bookings"),
    supabase.rpc("my_week_stats"),
  ]);
  const bookings = (data ?? []) as BookingRow[];
  const stats = (statsData ?? { attended: 0, minutes: 0 }) as WeekStats;

  return (
    <Page>
      <h1 className="mb-2 text-3xl font-bold">Moje sesje</h1>
      <p className="mb-6 text-muted" data-testid="week-stats">
        Odbyte sesje w tym tygodniu: {stats.attended}
        {stats.attended > 0 && ` (${stats.minutes} min razem)`}
      </p>
      {bookings.length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-muted">Nie masz zaplanowanych sesji.</p>
          <ButtonLink href="/zaplanuj" block>
            Zaplanuj sesję
          </ButtonLink>
        </div>
      ) : (
        <BookingList bookings={bookings} nowIso={new Date().toISOString()} />
      )}
    </Page>
  );
}
