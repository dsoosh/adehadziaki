"use server";

import { getActivity, isActivityId } from "@/lib/activities";
import { toUserMessage } from "@/lib/errors";
import { notifyUser } from "@/lib/push";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { dayLabel, formatTime } from "@/lib/time";

export type JoinResult =
  | { status: "matched"; sessionId: string; slotStart?: string }
  | { status: "gone" }
  | { status: "error"; message: string };

export async function joinNow(ticket: string, activity: string): Promise<JoinResult> {
  if (!isActivityId(activity)) return { status: "error", message: "Wybierz czynność." };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("instant_join_ticket", { p_ticket: ticket, p_activity: activity });
  if (error) return { status: "error", message: toUserMessage(error) };
  const res = data as { status: string; session_id?: string };
  return res.status === "matched" && res.session_id ? { status: "matched", sessionId: res.session_id } : { status: "gone" };
}

export async function joinScheduled(bookingId: string, activity: string): Promise<JoinResult> {
  if (!isActivityId(activity)) return { status: "error", message: "Wybierz czynność." };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("book_with", { p_booking: bookingId, p_activity: activity });
  if (error) return { status: "error", message: toUserMessage(error) };
  const res = data as { status: string; session_id?: string; slot_start?: string };
  if (res.status !== "matched" || !res.session_id) return { status: "gone" };

  // Powiadomienie gospodarza (user_a sesji). Bez klucza service role – pomijamy.
  try {
    const { data: s } = await supabaseAdmin()
      .from("sessions")
      .select("user_a, activity_b, starts_at")
      .eq("id", res.session_id)
      .single();
    if (s) {
      const start = new Date(s.starts_at);
      await notifyUser(s.user_a, {
        title: "Masz partnera!",
        body: `Ktoś dołączył do Twojej sesji ${dayLabel(start, new Date())} o ${formatTime(start)} (${getActivity(s.activity_b).label}).`,
        url: "/sesje",
      });
    }
  } catch {
    // powiadomienie nie jest krytyczne
  }
  return { status: "matched", sessionId: res.session_id, slotStart: res.slot_start };
}
