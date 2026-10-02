import { createClient } from "@supabase/supabase-js";

/** Czyści kolejkę i rezerwacje przed testami – wyłącznie na lokalnym Supabase. */
export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) return;
  const admin = createClient(url, key, { auth: { persistSession: false } });
  await admin.from("match_queue").delete().not("user_id", "is", null);
  await admin.from("bookings").delete().not("id", "is", null);
}
