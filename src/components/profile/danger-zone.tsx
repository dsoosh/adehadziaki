"use client";

import { useState, useTransition } from "react";
import { signOut } from "@/app/(auth)/actions";
import { deleteAccount } from "@/app/(app)/profil/actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <form action={signOut}>
        <Button type="submit" variant="secondary" block>
          Wyloguj się
        </Button>
      </form>
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-danger p-4">
          <p className="font-bold">Usunąć konto na zawsze?</p>
          <p>Usuniemy Twój profil, historię sesji i anulujemy zaplanowane sesje. Tego nie da się cofnąć.</p>
          {error && <Notice tone="danger">{error}</Notice>}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteAccount();
                  if (res?.error) setError(res.error);
                })
              }
            >
              {pending ? "Usuwanie…" : "Tak, usuń konto"}
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Nie usuwaj
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="self-start px-0 text-danger" onClick={() => setConfirming(true)}>
          Usuń konto
        </Button>
      )}
    </div>
  );
}
