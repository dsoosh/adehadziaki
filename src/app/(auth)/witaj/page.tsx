import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { safeNext } from "@/lib/safe-next";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Witaj" };

/** Ostatni krok rejestracji przez Google: nazwa wyświetlana i zgoda na regulamin. */
export default async function WelcomePage(props: PageProps<"/witaj">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=${encodeURIComponent("/witaj")}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, accepted_terms_at")
    .eq("id", user.id)
    .single<{ display_name: string; accepted_terms_at: string | null }>();
  if (profile?.accepted_terms_at) redirect(next);

  const googleName = String(user.user_metadata?.given_name ?? user.user_metadata?.name ?? "").trim();
  const suggestedName = (googleName || profile?.display_name || "").slice(0, 30);

  return (
    <AuthShell title="Witaj!" intro="Jeszcze jeden krok: powiedz, jak mamy Cię nazywać, i zaakceptuj zasady.">
      <WelcomeForm next={next} suggestedName={suggestedName} />
    </AuthShell>
  );
}
