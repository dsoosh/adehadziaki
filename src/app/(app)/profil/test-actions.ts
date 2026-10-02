"use server";

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";

const TEST_MINUTES = 25;

/** Sesja testowa admina: ta sama osoba po obu stronach (drugie urządzenie lub karta). */
export async function startTestSession(fd: FormData): Promise<void> {
  const { user } = await requireUser("/profil");
  if (!isAdmin(user.email)) redirect("/profil");

  const mode = fd.get("mode") === "audio" ? "audio" : "video";
  const start = new Date();
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .insert({
      kind: "test",
      user_a: user.id,
      user_b: user.id,
      activity_a: "inne",
      activity_b: "inne",
      goal_a: "Test połączenia",
      goal_b: "Test połączenia",
      duration: TEST_MINUTES,
      mode,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + TEST_MINUTES * 60_000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Nie udało się utworzyć sesji testowej");
  redirect(`/sesja/${data.id}`);
}
