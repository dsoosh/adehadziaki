"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

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
      <div className="flex flex-col gap-2">
        <label className="flex min-h-12 items-start gap-3">
          <input
            type="checkbox"
            name="terms"
            className="mt-1 size-6 shrink-0 accent-[var(--accent)]"
            aria-invalid={state.errors?.terms ? true : undefined}
            aria-describedby={state.errors?.terms ? "terms-error" : undefined}
          />
          <span>
            Akceptuję{" "}
            <Link href="/regulamin" className="font-bold text-accent" target="_blank">
              regulamin
            </Link>{" "}
            i{" "}
            <Link href="/prywatnosc" className="font-bold text-accent" target="_blank">
              politykę prywatności
            </Link>
            .
          </span>
        </label>
        {state.errors?.terms && (
          <p id="terms-error" className="text-base font-bold text-danger">
            {state.errors.terms}
          </p>
        )}
      </div>
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
  );
}
