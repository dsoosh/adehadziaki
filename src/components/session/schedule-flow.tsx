"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getActivity, MODE_LABELS, type CallMode } from "@/lib/activities";
import { toUserMessage } from "@/lib/errors";
import type { SessionChoice } from "@/lib/session-params";
import { groupByDay, upcomingSlots } from "@/lib/slots";
import { supabaseBrowser } from "@/lib/supabase/client";
import { dayLabel, formatTime } from "@/lib/time";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { StepHeader } from "@/components/ui/step-header";
import { PushPrompt } from "@/components/push-prompt";
import { SessionWizard } from "./wizard";

type Props = {
  profileMode: CallMode;
  initial: Partial<SessionChoice>;
  preselectedSlot?: string;
  pushEnabled: boolean;
};

type BookResult = { booking_id: string; status: "open" | "matched"; session_id: string | null };

export function ScheduleFlow({ profileMode, initial, preselectedSlot, pushEnabled }: Props) {
  const router = useRouter();
  const [choice, setChoice] = useState<SessionChoice | null>(null);
  const [slot, setSlot] = useState<Date | null>(preselectedSlot ? new Date(preselectedSlot) : null);
  const [waiting, setWaiting] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BookResult | null>(null);
  const [now] = useState(() => new Date());

  const slots = useMemo(() => upcomingSlots(now), [now]);

  useEffect(() => {
    if (!choice || slots.length === 0) return;
    supabaseBrowser()
      .rpc("slot_availability", {
        p_from: slots[0].toISOString(),
        p_to: slots[slots.length - 1].toISOString(),
        p_duration: choice.duration,
      })
      .then(({ data }: { data: unknown }) => {
        const map: Record<string, number> = {};
        for (const row of (data ?? []) as Array<{ slot_start: string; waiting: number }>) {
          map[new Date(row.slot_start).toISOString()] = row.waiting;
        }
        setWaiting(map);
      });
  }, [choice, slots]);

  async function book() {
    if (!choice || !slot) return;
    setPending(true);
    setError(null);
    const { data, error } = await supabaseBrowser().rpc("book_slot", {
      p_slot_start: slot.toISOString(),
      p_duration: choice.duration,
      p_activity: choice.activity,
      p_mode: choice.mode,
      p_goal: choice.goal || null,
    });
    setPending(false);
    if (error) {
      setError(toUserMessage(error));
      return;
    }
    setResult(data as BookResult);
  }

  if (!choice) {
    return (
      <SessionWizard
        profileMode={profileMode}
        initial={initial}
        submitLabel="Wybierz godzinę"
        onSubmit={setChoice}
        onCancel={() => router.push("/start")}
      />
    );
  }

  if (result) {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Zarezerwowane!</h1>
        <Card>
          <p className="text-2xl font-bold">
            {dayLabel(slot!, now)}, {formatTime(slot!)}
          </p>
          <p className="text-muted">
            {getActivity(choice.activity).label} · {choice.duration} min · {MODE_LABELS[choice.mode]}
          </p>
        </Card>
        <Notice tone={result.status === "matched" ? "success" : "info"}>
          {result.status === "matched"
            ? "Masz już partnera. Do zobaczenia!"
            : "Czekamy na partnera. Jeśli nikt się nie zapisze, tuż przed startem poszukamy kogoś w kolejce."}
        </Notice>
        {!pushEnabled && <PushPrompt />}
        <ButtonLink href="/sesje" block>
          Moje sesje
        </ButtonLink>
      </section>
    );
  }

  if (slot) {
    return (
      <section className="flex flex-col gap-6">
        <StepHeader step={4} total={4} title="Potwierdź rezerwację" onBack={() => setSlot(null)} />
        <Card>
          <p className="text-2xl font-bold">
            {dayLabel(slot, now)}, {formatTime(slot)}
          </p>
          <p className="text-muted">
            {getActivity(choice.activity).label} · {choice.duration} min · {MODE_LABELS[choice.mode]}
          </p>
          {choice.goal && <p className="mt-2">Cel: {choice.goal}</p>}
        </Card>
        {error && <Notice tone="danger">{error}</Notice>}
        <Button block onClick={book} disabled={pending}>
          {pending ? "Rezerwuję…" : "Zarezerwuj"}
        </Button>
      </section>
    );
  }

  return (
    <section>
      <StepHeader
        step={4}
        total={4}
        title="Na którą godzinę?"
        hint="„Ktoś już czeka” oznacza, że od razu będziesz mieć partnera."
        onBack={() => setChoice(null)}
      />
      {groupByDay(slots).map((g) => (
        <div key={g.day} className="mb-6">
          <h2 className="mb-3 text-xl font-bold first-letter:uppercase">{dayLabel(g.slots[0], now)}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {g.slots.map((s) => {
              const count = waiting[s.toISOString()] ?? 0;
              return (
                <li key={s.toISOString()}>
                  <button
                    type="button"
                    onClick={() => setSlot(s)}
                    className={
                      count > 0
                        ? "flex min-h-16 w-full flex-col items-center justify-center rounded-2xl border-2 border-success bg-success-soft px-2 py-2"
                        : "flex min-h-16 w-full flex-col items-center justify-center rounded-2xl border-2 border-border bg-surface px-2 py-2 hover:border-accent"
                    }
                  >
                    <span className="text-xl font-bold tabular-nums">{formatTime(s)}</span>
                    {count > 0 && <span className="text-sm font-bold text-success">Ktoś już czeka</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
