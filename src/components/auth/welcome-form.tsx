"use client";

import { useActionState } from "react";
import { acceptTerms, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { TermsCheckbox } from "./terms-checkbox";

export function WelcomeForm({ next, suggestedName }: { next: string; suggestedName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(acceptTerms, {});
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field
        label="Jak mamy Cię nazywać?"
        name="displayName"
        autoComplete="nickname"
        hint="To zobaczy Twój partner w sesji. Wystarczy imię."
        maxLength={30}
        required
        error={state.errors?.displayName}
        defaultValue={state.values?.displayName ?? suggestedName}
      />
      <TermsCheckbox error={state.errors?.terms} />
      {state.message && <Notice tone="danger">{state.message}</Notice>}
      <Button type="submit" block disabled={pending}>
        {pending ? "Zapisywanie…" : "Zaczynamy"}
      </Button>
    </form>
  );
}
