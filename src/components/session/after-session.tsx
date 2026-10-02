"use client";

import { useState, useTransition } from "react";
import { blockPartner, submitFeedback, type Outcome } from "@/app/(app)/sesja/[id]/actions";
import type { SessionDetails } from "@/lib/session-types";
import { choiceToSearch } from "@/lib/session-params";
import { getActivity } from "@/lib/activities";
import { ButtonLink, Button } from "@/components/ui/button";
import { ChoiceTile } from "@/components/ui/choice-tile";
import { Notice } from "@/components/ui/notice";
import { ReportForm } from "./report-form";

const OUTCOMES: Array<{ id: Outcome; label: string }> = [
  { id: "udalo", label: "Udało się" },
  { id: "czesciowo", label: "Częściowo" },
  { id: "nie", label: "Nie tym razem" },
];

export function AfterSession({ session, reported }: { session: SessionDetails; reported: boolean }) {
  const [outcome, setOutcome] = useState<Outcome | null>(session.feedback);
  const [blocked, setBlocked] = useState(session.blocked || reported);
  const [justReported, setJustReported] = useState(reported);
  const [reporting, setReporting] = useState(false);
  const [pending, start] = useTransition();

  const again = `/teraz?${choiceToSearch({
    activity: getActivity(session.me.activity).id,
    duration: session.duration,
    mode: session.mode,
  })}`;

  if (reporting) {
    return (
      <ReportForm
        sessionId={session.id}
        onCancel={() => setReporting(false)}
        onDone={() => {
          setReporting(false);
          setBlocked(true);
          setJustReported(true);
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Koniec sesji</h1>

      {justReported && <Notice tone="success">Dziękujemy. Nie połączymy Was ponownie.</Notice>}

      <div>
        <h2 className="mb-3 text-xl font-bold">Jak poszło?</h2>
        <p className="mb-3 text-muted">Odpowiedź widzisz tylko Ty.</p>
        <div role="radiogroup" aria-label="Jak poszło?" className="flex flex-col gap-3">
          {OUTCOMES.map((o) => (
            <ChoiceTile
              key={o.id}
              label={o.label}
              selected={outcome === o.id}
              onSelect={() => {
                setOutcome(o.id);
                start(async () => {
                  await submitFeedback(session.id, o.id);
                });
              }}
            />
          ))}
        </div>
      </div>

      {outcome && (
        <div className="flex flex-col gap-3">
          {outcome === "udalo" && <p className="font-bold text-success">Świetnie! Brawo za dowiezienie.</p>}
          {outcome === "nie" && <p className="text-muted">Bywa. Samo przyjście na sesję to już krok.</p>}
          <ButtonLink href={again} block>
            Jeszcze jedna sesja
          </ButtonLink>
          <ButtonLink href="/start" variant="secondary" block>
            Na dziś wystarczy
          </ButtonLink>
        </div>
      )}

      <div className="flex flex-col items-start gap-1 border-t-2 border-border pt-4">
        {blocked ? (
          <p className="text-muted">Nie połączymy Cię więcej z: {session.partner.name}.</p>
        ) : (
          <Button
            variant="ghost"
            className="px-0"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await blockPartner(session.id);
                if (res.ok) setBlocked(true);
              })
            }
          >
            Nie łącz mnie więcej z tą osobą
          </Button>
        )}
        {!justReported && (
          <Button variant="ghost" className="px-0" onClick={() => setReporting(true)}>
            Zgłoś problem
          </Button>
        )}
      </div>
    </section>
  );
}
