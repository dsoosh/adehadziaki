import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Logowanie" };

export default async function LoginPage(props: PageProps<"/logowanie">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  return (
    <AuthShell title="Witaj z powrotem" intro="Zaloguj się, żeby zacząć sesję.">
      <LoginForm next={next} linkError={sp.blad === "link"} />
    </AuthShell>
  );
}
