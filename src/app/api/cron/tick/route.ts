import { getActivity } from "@/lib/activities";
import { shortName } from "@/lib/names";
import { notifyUser } from "@/lib/push";
import { pickReminders, reminderText } from "@/lib/reminders";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Wywoływane co minutę przez pg_cron (Supabase) z nagłówkiem
 * Authorization: Bearer $CRON_SECRET. Wysyła przypomnienia T-10 i T-1.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date();
  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id, user_id, slot_start, activity, session_id")
    .in("status", ["open", "matched"])
    .gt("slot_start", now.toISOString())
    .lte("slot_start", new Date(now.getTime() + 11 * 60_000).toISOString());
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!bookings?.length) return Response.json({ sent: 0 });

  const { data: sentRows } = await admin
    .from("reminders_sent")
    .select("booking_id, kind")
    .in("booking_id", bookings.map((b) => b.id));
  const sent = new Set((sentRows ?? []).map((r) => `${r.booking_id}:${r.kind}`));

  let count = 0;
  for (const r of pickReminders(bookings, sent, now)) {
    const b = bookings.find((x) => x.id === r.bookingId)!;
    // Najpierw rezerwujemy wysyłkę – przy równoległym ticku drugi insert się nie uda.
    const { error: dup } = await admin.from("reminders_sent").insert({ booking_id: b.id, kind: r.kind });
    if (dup) continue;

    let partnerName: string | null = null;
    if (b.session_id) {
      const { data: s } = await admin.from("sessions").select("user_a, user_b").eq("id", b.session_id).single();
      const partnerId = s ? (s.user_a === b.user_id ? s.user_b : s.user_a) : null;
      if (partnerId) {
        const { data: p } = await admin.from("profiles").select("display_name").eq("id", partnerId).single();
        partnerName = p ? shortName(p.display_name) : null;
      }
    }
    count += await notifyUser(b.user_id, {
      title: "Adehadziaki",
      body: reminderText(r.kind, getActivity(b.activity).label, partnerName),
      url: b.session_id ? `/sesja/${b.session_id}` : "/sesje",
    });
  }
  return Response.json({ sent: count });
}
