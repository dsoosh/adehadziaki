import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetRequestForm } from "@/components/auth/reset-forms";

export const metadata: Metadata = { title: "Reset hasła" };

export default function ResetPage() {
  return (
    <AuthShell title="Nie pamiętasz hasła?" intro="Podaj e-mail – wyślemy link do ustawienia nowego.">
      <ResetRequestForm />
    </AuthShell>
  );
}
