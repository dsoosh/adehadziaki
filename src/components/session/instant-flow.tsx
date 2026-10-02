"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CallMode } from "@/lib/activities";
import { toUserMessage } from "@/lib/errors";
import { nextSlot } from "@/lib/slots";
import { choiceToSearch, type SessionChoice } from "@/lib/session-params";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatElapsed, formatTime } from "@/lib/time";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { SessionWizard } from "./wizard";

type MatchResult = { status: "matched"; session_id: string } | { status: "waiting" | "expired" | "none" };

const POLL_MS = 2000;
const MAX_WAIT_MS = 3 * 60_000;

type Props = { profileMode: CallMode; initial: Partial<SessionChoice>; autoStart: boolean };

export function InstantFlow({ profileMode, initial, autoStart }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<"wizard" | "searching" | "expired">("wizard");
  const [choice, setChoice] = useState<SessionChoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const autoStarted = useRef(false);

  const handleResult = useCallback(
    (r: MatchResult) => {
      if (r.status === "matched") {
        router.push(`/sesja/${r.session_id}`);
        return true;
      }
      if (r.status === "expired" || r.status === "none") {
        setStage("expired");
        return true;
      }
      return false;
    },
    [router],
  );

  const start = useCallback(
    async (c: SessionChoice) => {
      setChoice(c);
      setError(null);
      setStage("searching");
      setStartedAt(Date.now());
      const { data, error } = await supabaseBrowser().rpc("instant_join", {
        p_duration: c.duration,
        p_activity: c.activity,
        p_mode: c.mode,
        p_goal: c.goal || null,
      });
      if (error) {
        setError(toUserMessage(error));
        setStage("wizard");
        return;
      }
      handleResult(data as MatchResult);
    },
    [handleResult],
  );

  useEffect(() => {
    if (autoStart && !autoStarted.current && initial.activity && initial.duration && initial.mode) {
      autoStarted.current = true;
      void start({ activity: initial.activity, duration: initial.duration, mode: initial.mode, goal: initial.goal ?? "" });
    }
  }, [autoStart, initial, start]);

  useEffect(() => {
    if (stage !== "searching") return;
    let stopped = false;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      const { data, error } = await supabaseBrowser().rpc("instant_poll");
      if (stopped) return;
      if (error) {
        setError(toUserMessage(error));
        return;
      }
      setError(null);
      if (handleResult(data as MatchResult)) stopped = true;
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [stage, handleResult]);

  async function cancel() {
    const { data } = await supabaseBrowser().rpc("instant_leave");
    if (data && (data as MatchResult).status === "matched") {
      handleResult(data as MatchResult);
      return;
    }
    router.push("/start");
  }

  if (stage === "searching") {
    const elapsed = Math.max(0, now - startedAt);
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center" aria-live="polite">
        <div className="relative flex size-36 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-accent-soft motion-safe:animate-pulse" aria-hidden />
          <span className="relative text-3xl font-bold tabular-nums" aria-label={`Czekasz ${formatElapsed(elapsed)}`}>
            {formatElapsed(elapsed)}
          </span>
        </div>
        <h1 className="text-3xl font-bold">Szukamy kogoś do wspólnej sesji…</h1>
        <p className="text-muted">
          Zwykle trwa to mniej niż minutę. Możesz w tym czasie przygotować to, czego potrzebujesz.
        </p>
        {elapsed > MAX_WAIT_MS - 30_000 && <p className="text-muted">Jeszcze chwilka…</p>}
        {error && <Notice tone="warning">{error}</Notice>}
        <Button variant="secondary" onClick={cancel}>
          Anuluj
        </Button>
      </section>
    );
  }

  if (stage === "expired" && choice) {
    const slot = nextSlot(new Date());
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Tym razem nikogo nie ma</h1>
        <p className="text-muted">
          To nie Twoja wina – o tej porze jest mniej osób. Spróbuj jeszcze raz albo umów się na konkretną godzinę.
        </p>
        <Button block onClick={() => start(choice)}>
          Szukaj jeszcze raz
        </Button>
        <ButtonLink
          variant="secondary"
          block
          href={`/zaplanuj?${choiceToSearch(choice)}&slot=${encodeURIComponent(slot.toISOString())}`}
        >
          Zaplanuj na {formatTime(slot)}
        </ButtonLink>
      </section>
    );
  }

  return (
    <>
      {error && <Notice tone="danger" className="mb-6">{error}</Notice>}
      <SessionWizard
        profileMode={profileMode}
        initial={choice ?? initial}
        submitLabel="Szukaj partnera"
        onSubmit={start}
        onCancel={() => router.push("/start")}
      />
    </>
  );
}
