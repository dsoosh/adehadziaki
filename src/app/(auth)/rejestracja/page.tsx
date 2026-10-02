import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Załóż konto" };

export default function SignupPage() {
  return (
    <AuthShell title="Załóż konto" intro="Zajmie to minutę. Potem wybierzesz, co chcesz zrobić.">
      <SignupForm />
    </AuthShell>
  );
}
