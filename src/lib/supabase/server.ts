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
  accepted_terms_at: string | null;
  /** Koniec planu Plus; null = plan darmowy. */
  plus_until: string | null;
};

/**
 * Zalogowany użytkownik i jego profil. Bez logowania przekierowuje do logowania,
 * a bez zgody na regulamin (konto z Google) – do ekranu powitalnego.
 */
export async function requireUser(nextPath = "/start") {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent(nextPath)}`);
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, default_mode, push_enabled, accepted_terms_at, plus_until")
    .eq("id", user.id)
    .single<Profile>();
  // Brak profilu (konto sprzed migracji) lub brak zgody – ekran powitalny je uzupełni.
  if (!profile?.accepted_terms_at) redirect(`/witaj?next=${encodeURIComponent(nextPath)}`);
  return { supabase, user, profile: profile as Profile };
}
