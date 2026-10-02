import type { Metadata } from "next";
import { connection } from "next/server";
import { BookingList, type BookingRow } from "@/components/session/booking-list";
import { ButtonLink } from "@/components/ui/button";
import { Page } from "@/components/ui/page";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Moje sesje" };

export default async function MySessionsPage() {
  await connection();
  const { supabase } = await requireUser("/sesje");
  const { data } = await supabase.rpc("my_bookings");
  const bookings = (data ?? []) as BookingRow[];

  return (
    <Page>
      <h1 className="mb-6 text-3xl font-bold">Moje sesje</h1>
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
