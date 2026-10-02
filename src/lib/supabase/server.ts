import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Wywołane z Server Component – sesję odświeża proxy.ts.
        }
      },
    },
  });
}

/** Klient z kluczem service_role – tylko dla zadań serwerowych (cron, push). */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Brak SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Profile = {
  id: string;
  display_name: string;
  default_mode: "video" | "audio";
  push_enabled: boolean;
};

/** Zalogowany użytkownik i jego profil; bez logowania przekierowuje. */
export async function requireUser(nextPath = "/start") {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(nextPath)}`);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, default_mode, push_enabled")
    .eq("id", user.id)
    .single<Profile>();
  return { supabase, user, profile };
}
