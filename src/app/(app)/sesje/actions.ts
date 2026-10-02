"use server";

import { revalidatePath } from "next/cache";
import { toUserMessage } from "@/lib/errors";
import { notifyUser } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase/server";

export async function cancelBooking(bookingId: string): Promise<{ error?: string }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("cancel_booking", { p_booking: bookingId });
  if (error) return { error: toUserMessage(error) };

  const res = data as { partner_id: string | null; partner_rematched?: boolean } | null;
  if (res?.partner_id) {
    await notifyUser(res.partner_id, {
      title: "Zmiana w Twojej sesji",
      body: res.partner_rematched
        ? "Twój partner zrezygnował, ale mamy już dla Ciebie kogoś nowego."
        : "Twój partner zrezygnował. Szukamy dla Ciebie kogoś innego.",
      url: "/sesje",
    }).catch(() => undefined);
  }
  revalidatePath("/sesje");
  return {};
}
