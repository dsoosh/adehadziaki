"use client";

import { useState, useTransition } from "react";
import { cancelBooking } from "@/app/(app)/sesje/actions";
import { getActivity, MODE_LABELS, type CallMode } from "@/lib/activities";
import { JOIN_EARLY_MS } from "@/lib/session-phase";
import { choiceToSearch } from "@/lib/session-params";
import { dayLabel, formatTime } from "@/lib/time";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";

export type BookingRow = {
  id: string;
  slot_start: string;
  slot_end: string;
  duration: 25 | 50 | 75;
  activity: string;
  mode: CallMode;
  goal: string | null;
  status: "open" | "matched";
  session_id: string | null;
  partner_name: string | null;
};

export function BookingList({ bookings, nowIso }: { bookings: BookingRow[]; nowIso: string }) {
  const now = new Date(nowIso);
  return (
    <ul className="flex flex-col gap-4">
      {bookings.map((b) => (
        <li key={b.id}>
          <BookingCard booking={b} now={now} />
        </li>
      ))}
    </ul>
  );
}

function BookingCard({ booking: b, now }: { booking: BookingRow; now: Date }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const start = new Date(b.slot_start);
  const started = start.getTime() <= now.getTime();
  const canEnter = b.session_id && start.getTime() - JOIN_EARLY_MS <= now.getTime();
  const activity = getActivity(b.activity);

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-2xl font-bold first-letter:uppercase">
          {dayLabel(start, now)}, {formatTime(start)}
        </p>
        <p className="text-muted">
          {activity.label} · {b.duration} min · {MODE_LABELS[b.mode]}
        </p>
      </div>

      {b.status === "matched" ? (
        <p className="font-bold text-success">Masz partnera: {b.partner_name ?? "—"}</p>
      ) : started ? (
        <p className="font-bold text-warning">Nikt się nie zapisał na tę godzinę.</p>
      ) : (
        <p className="font-bold text-muted">Czekamy na partnera</p>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      {canEnter && (
        <ButtonLink href={`/sesja/${b.session_id}`} block>
          Wejdź do pokoju
        </ButtonLink>
      )}

      {b.status === "open" && start.getTime() - 2 * 60_000 <= now.getTime() && (
        <ButtonLink
          href={`/teraz?${choiceToSearch({ activity: activity.id, duration: b.duration, mode: b.mode, goal: b.goal ?? "" })}&auto=1`}
          block
        >
          Szukaj kogoś teraz
        </ButtonLink>
      )}

      {!started &&
        (confirming ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4">
            <p className="font-bold">Na pewno anulować?</p>
            {b.status === "matched" && <p className="text-muted">Damy znać partnerowi i poszukamy mu kogoś innego.</p>}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="danger"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await cancelBooking(b.id);
                    if (res.error) setError(res.error);
                  })
                }
              >
                {pending ? "Anuluję…" : "Tak, anuluj"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Zostaw
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="self-start px-0" onClick={() => setConfirming(true)}>
            Anuluj rezerwację
          </Button>
        ))}
    </Card>
  );
}
