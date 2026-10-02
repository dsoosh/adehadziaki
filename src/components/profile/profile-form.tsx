"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/(app)/profil/actions";
import { MODE_LABELS } from "@/lib/activities";
import type { Profile } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        label="Nazwa wyświetlana"
        name="displayName"
        defaultValue={profile.display_name}
        maxLength={30}
        hint="Widzi ją partner w sesji."
        error={state.error}
        required
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Domyślny sposób rozmowy</legend>
        {(["video", "audio"] as const).map((m) => (
          <label
            key={m}
            className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name="defaultMode"
              value={m}
              defaultChecked={profile.default_mode === m}
              className="size-5 accent-[var(--accent)]"
            />
            {MODE_LABELS[m]}
          </label>
        ))}
      </fieldset>
      {state.message && <Notice tone={state.ok ? "success" : "danger"}>{state.message}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? "Zapisywanie…" : "Zapisz zmiany"}
      </Button>
    </form>
  );
}
