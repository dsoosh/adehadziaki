"use client";

import { useActionState } from "react";
import { requestPasswordReset, setNewPassword, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="E-mail" name="email" type="email" autoComplete="email" required error={state.errors?.email} />
      <Button type="submit" block disabled={pending}>
        {pending ? "Wysyłanie…" : "Wyślij link"}
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(setNewPassword, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        label="Nowe hasło"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Co najmniej 8 znaków."
        required
        error={state.errors?.password}
      />
      {state.message && <Notice tone="danger">{state.message}</Notice>}
      <Button type="submit" block disabled={pending}>
        {pending ? "Zapisywanie…" : "Zapisz nowe hasło"}
      </Button>
    </form>
  );
}
