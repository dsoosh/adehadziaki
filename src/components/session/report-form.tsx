"use client";

import { useState, useTransition } from "react";
import { reportPartner, type ReportReason } from "@/app/(app)/sesja/[id]/actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

const REASONS: Array<{ id: ReportReason; label: string }> = [
  { id: "zachowanie", label: "Niestosowne zachowanie" },
  { id: "seksualne", label: "Treści seksualne" },
  { id: "obrazliwe", label: "Obraźliwe słowa" },
  { id: "spam", label: "Spam lub reklama" },
  { id: "inne", label: "Coś innego" },
];

export function ReportForm({ sessionId, onDone, onCancel }: { sessionId: string; onDone: () => void; onCancel: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason) return;
        start(async () => {
          const res = await reportPartner(sessionId, reason, details.trim());
          if (res.ok) onDone();
          else setError(true);
        });
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xl font-bold">Co się stało?</legend>
        {REASONS.map((r) => (
          <label
            key={r.id}
            className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name="reason"
              value={r.id}
              checked={reason === r.id}
              onChange={() => setReason(r.id)}
              className="size-5 accent-[var(--accent)]"
            />
            {r.label}
          </label>
        ))}
      </fieldset>
      <label htmlFor="details" className="font-bold">
        Opis (nieobowiązkowy)
      </label>
      <textarea
        id="details"
        maxLength={1000}
        rows={3}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        className="rounded-xl border-2 border-border bg-surface p-3"
      />
      {error && <Notice tone="danger">Nie udało się wysłać zgłoszenia. Spróbuj ponownie.</Notice>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="danger" disabled={!reason || pending}>
          {pending ? "Wysyłanie…" : "Zgłoś i zablokuj"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Wróć
        </Button>
      </div>
    </form>
  );
}
