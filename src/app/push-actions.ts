"use server";

import { supabaseServer } from "@/lib/supabase/server";

type SubscriptionJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function savePushSubscription(sub: SubscriptionJSON): Promise<{ ok: boolean }> {
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys.auth) return { ok: false };
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  });
  if (error) return { ok: false };
  await supabase.from("profiles").update({ push_enabled: true }).eq("id", user.id);
  return { ok: true };
}

export async function disablePush(endpoint: string | null): Promise<void> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (endpoint) await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  else await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  await supabase.from("profiles").update({ push_enabled: false }).eq("id", user.id);
}
