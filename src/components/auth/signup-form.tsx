"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { GoogleButton, OrDivider } from "./google-button";
import { TermsCheckbox } from "./terms-checkbox";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});

  if (state.ok) {
    return (
      <Notice tone="success">
        <p className="font-bold">{state.message}</p>
        <p>Kliknij link w wiadomości, a potem wróć tutaj. Jeśli nic nie przyszło, zajrzyj do spamu.</p>
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GoogleButton label="Załóż konto przez Google" />
      <OrDivider />
      <form action={action} className="flex flex-col gap-5" noValidate>
        <Field
          label="Jak mamy Cię nazywać?"
          name="displayName"
          autoComplete="nickname"
          hint="To zobaczy Twój partner w sesji. Wystarczy imię."
          maxLength={30}
          required
          error={state.errors?.displayName}
          defaultValue={state.values?.displayName}
        />
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          hint="Partner go nie zobaczy."
          required
          error={state.errors?.email}
          defaultValue={state.values?.email}
        />
        <Field
          label="Hasło"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Co najmniej 8 znaków."
          required
          error={state.errors?.password}
        />
        <TermsCheckbox error={state.errors?.terms} />
        {state.message && <Notice tone="danger">{state.message}</Notice>}
        <Button type="submit" block disabled={pending}>
          {pending ? "Zakładanie konta…" : "Załóż konto"}
        </Button>
        <p className="text-center">
          Masz już konto?{" "}
          <Link href="/logowanie" className="font-bold text-accent">
            Zaloguj się
          </Link>
        </p>
      </form>
    </div>
  );
}
