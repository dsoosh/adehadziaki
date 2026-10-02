"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { sendMagicLink, signInWithGoogle, signInWithPassword, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [pwState, pwAction, pwPending] = useActionState<FormState, FormData>(signInWithPassword, {});
  const [linkState, linkAction, linkPending] = useActionState<FormState, FormData>(sendMagicLink, {});

  return (
    <div className="flex flex-col gap-6">
      {linkError && <Notice tone="warning">Link wygasł albo był już użyty. Zaloguj się ponownie.</Notice>}

      {mode === "password" ? (
        <form action={pwAction} className="flex flex-col gap-5">
          <input type="hidden" name="next" value={next} />
          <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={pwState.values?.email} />
          <Field label="Hasło" name="password" type="password" autoComplete="current-password" required />
          {pwState.message && <Notice tone="danger">{pwState.message}</Notice>}
          <Button type="submit" block disabled={pwPending}>
            {pwPending ? "Logowanie…" : "Zaloguj się"}
          </Button>
          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" className="min-h-12 font-bold text-accent" onClick={() => setMode("link")}>
              Wyślij mi link zamiast hasła
            </button>
            <Link href="/reset-hasla" className="flex min-h-12 items-center font-bold text-accent">
              Nie pamiętam hasła
            </Link>
          </div>
        </form>
      ) : (
        <form action={linkAction} className="flex flex-col gap-5">
          <input type="hidden" name="next" value={next} />
          <Field
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={linkState.errors?.email}
            defaultValue={linkState.values?.email}
          />
          {linkState.message && <Notice tone="success">{linkState.message}</Notice>}
          <Button type="submit" block disabled={linkPending}>
            {linkPending ? "Wysyłanie…" : "Wyślij link do logowania"}
          </Button>
          <button type="button" className="min-h-12 self-start font-bold text-accent" onClick={() => setMode("password")}>
            Wolę zalogować się hasłem
          </button>
        </form>
      )}

      <div className="flex items-center gap-3 text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" /> albo <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" block>
          Zaloguj się przez Google
        </Button>
      </form>

      <p className="text-center">
        Nie masz konta?{" "}
        <Link href="/rejestracja" className="font-bold text-accent">
          Załóż konto
        </Link>
      </p>
    </div>
  );
}
