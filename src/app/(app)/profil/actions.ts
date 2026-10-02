"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { validateDisplayName } from "@/lib/validation";

export type ProfileState = { ok?: boolean; error?: string; message?: string };

export async function updateProfile(_prev: ProfileState, fd: FormData): Promise<ProfileState> {
  const displayName = String(fd.get("displayName") ?? "").trim();
  const mode = fd.get("defaultMode") === "audio" ? "audio" : "video";
  const err = validateDisplayName(displayName);
  if (err) return { error: err };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/profil");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, default_mode: mode })
    .eq("id", user.id);
  if (error) return { message: "Nie udało się zapisać. Spróbuj ponownie." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Zapisano." };
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "Nie udało się usunąć konta. Spróbuj ponownie." };
  await supabase.auth.signOut();
  redirect("/?konto=usuniete");
}
