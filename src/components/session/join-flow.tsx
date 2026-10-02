"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinNow, joinScheduled } from "@/app/(app)/dolacz/actions";
import { ACTIVITIES } from "@/lib/activities";
import type { LobbyData } from "@/lib/lobby-types";
import { supabaseBrowser } from "@/lib/supabase/client";
import { dayLabel, formatElapsed, formatTime } from "@/lib/time";
import { ButtonLink } from "@/components/ui/button";
import { ChoiceTile } from "@/components/ui/choice-tile";
import { Notice } from "@/components/ui/notice";
import { StepHeader } from "@/components/ui/step-header";
import { PushPrompt } from "@/components/push-prompt";
import { LobbyCard } from "./lobby";

type Props = { ticket?: string; bookingId?: string; pushEnabled: boolean };
type Host = { name: string; activity: string; duration: number; mode: "video" | "audio"; aside: string };

/** Dołączenie do osoby z listy: jedno pytanie „Co Ty będziesz robić?”. */
export function JoinFlow({ ticket, bookingId, pushEnabled }: Props) {
  const router = useRouter();
  const [host, setHost] = useState<Host | null | undefined>(undefined);
  const [state, setState] = useState<"choose" | "gone" | "booked">("choose");
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    supabaseBrowser()
      .rpc("lobby")
      .then(({ data }: { data: unknown }) => {
        const lobby = data as LobbyData | null;
        const now = new Date();
        if (ticket) {
          const e = lobby?.now.find((x) => x.ticket === ticket);
          setHost(e ? { ...e, aside: `czeka ${formatElapsed(now.getTime() - new Date(e.since).getTime())}` } : null);
        } else {
          const e = lobby?.scheduled.find((x) => x.booking_id === bookingId);
          setHost(e ? { ...e, aside: `${dayLabel(new Date(e.slot_start), now)} ${formatTime(new Date(e.slot_start))}` } : null);
        }
      });
  }, [ticket, bookingId]);

  if (host === undefined) return null;

  if (host === null || state === "gone") {
    return (
      <section key="gone" className="flex animate-view-in flex-col gap-6">
        <h1 className="text-3xl font-bold">Ta osoba już znalazła partnera</h1>
        <p className="text-muted">Ktoś był szybszy albo oczekiwanie się skończyło. Wybierz kogoś innego albo zacznij sam.</p>
        <ButtonLink href="/start" block>
          Wróć do listy
        </ButtonLink>
        <ButtonLink href="/teraz" variant="secondary" block>
          Szukaj kogoś
        </ButtonLink>
      </section>
    );
  }

  if (state === "booked" && slotStart) {
    const start = new Date(slotStart);
    return (
      <section key="booked" className="flex animate-view-in flex-col gap-6">
        <h1 className="text-3xl font-bold">Zapisane!</h1>
        <Notice tone="success">
          Masz sesję z: {host.name} – {dayLabel(start, new Date())} o {formatTime(start)}.
        </Notice>
        {!pushEnabled && <PushPrompt />}
        <ButtonLink href="/sesje" block>
          Moje sesje
        </ButtonLink>
      </section>
    );
  }

  return (
    <section key="choose" className="animate-view-in">
      <StepHeader step={1} total={1} title="Co Ty będziesz robić?" onBack={() => router.push("/start")} />
      <p className="mb-2 text-muted">Dołączasz do:</p>
      <div className="mb-6">
        <LobbyCard name={host.name} activity={host.activity} duration={host.duration} mode={host.mode} aside={host.aside} />
      </div>
      {error && (
        <Notice tone="danger" className="mb-4">
          {error}
        </Notice>
      )}
      <div role="radiogroup" aria-label="Twoja czynność" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIVITIES.map((a) => (
          <ChoiceTile
            key={a.id}
            label={a.label}
            icon={a.icon}
            selected={chosen === a.id}
            onSelect={() => {
              if (pending) return;
              setChosen(a.id);
              setError(null);
              start(async () => {
                const res = ticket ? await joinNow(ticket, a.id) : await joinScheduled(bookingId!, a.id);
                if (res.status === "error") setError(res.message);
                else if (res.status === "gone") setState("gone");
                else if (ticket) router.push(`/sesja/${res.sessionId}`);
                else {
                  setSlotStart(res.slotStart ?? null);
                  setState("booked");
                }
              });
            }}
          />
        ))}
      </div>
      {pending && (
        <p className="mt-4 text-center text-muted" role="status">
          Łączę…
        </p>
      )}
    </section>
  );
}
