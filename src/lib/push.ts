import "server-only";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/server";

export type PushPayload = { title: string; body: string; url: string };

let configured: boolean | null = null;

function configure(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:kontakt@example.com";
  configured = Boolean(pub && priv && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (configured) webpush.setVapidDetails(subject, pub!, priv!);
  return configured;
}

/** Wysyła powiadomienie na wszystkie urządzenia użytkownika; usuwa wygasłe subskrypcje. */
export async function notifyUser(userId: string, payload: PushPayload): Promise<number> {
  if (!configure()) return 0;
  const admin = supabaseAdmin();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  let sent = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 600, urgency: "high" },
      );
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
    }
  }
  return sent;
}
