import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { NewPasswordForm } from "@/components/auth/reset-forms";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nowe hasło" };

export default async function NewPasswordPage() {
  await requireUser("/nowe-haslo");
  return (
    <AuthShell title="Ustaw nowe hasło">
      <NewPasswordForm />
    </AuthShell>
  );
}
