"use client";

import { useState } from "react";
import { Headphones, Video } from "lucide-react";
import { ACTIVITIES, DURATIONS, MODE_LABELS, getActivity, suggestedMode, type CallMode } from "@/lib/activities";
import type { SessionChoice } from "@/lib/session-params";
import { Button } from "@/components/ui/button";
import { ChoiceTile } from "@/components/ui/choice-tile";
import { StepHeader } from "@/components/ui/step-header";

type Props = {
  profileMode: CallMode;
  initial?: Partial<SessionChoice>;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (choice: SessionChoice) => void;
  onCancel?: () => void;
};

const TOTAL = 4;

/** Kreator: czynność → czas → tryb → cel. Jedno pytanie na ekran. */
export function SessionWizard({ profileMode, initial = {}, submitLabel, pending, onSubmit, onCancel }: Props) {
  const [step, setStep] = useState(() => (initial.activity && initial.duration && initial.mode ? 4 : 1));
  const [choice, setChoice] = useState<Partial<SessionChoice>>(initial);

  const back = () => setStep((s) => Math.max(1, s - 1));

  if (step === 1) {
    return (
      <section>
        <StepHeader step={1} total={TOTAL} title="Co chcesz zrobić?" onBack={onCancel} />
        <div role="radiogroup" aria-label="Czynność" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACTIVITIES.map((a) => (
            <ChoiceTile
              key={a.id}
              label={a.label}
              icon={a.icon}
              selected={choice.activity === a.id}
              onSelect={() => {
                setChoice((c) => ({ ...c, activity: a.id, mode: suggestedMode(a.id, profileMode) }));
                setStep(2);
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (step === 2) {
    return (
      <section>
        <StepHeader step={2} total={TOTAL} title="Jak długo?" hint="Krótsza sesja to dobry start." onBack={back} />
        <div role="radiogroup" aria-label="Czas trwania" className="flex flex-col gap-3">
          {DURATIONS.map((d) => (
            <ChoiceTile
              key={d}
              label={`${d} min`}
              description={d === 25 ? "Na rozgrzewkę" : d === 50 ? "Najczęstszy wybór" : "Dłuższy blok"}
              selected={choice.duration === d}
              onSelect={() => {
                setChoice((c) => ({ ...c, duration: d }));
                setStep(3);
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (step === 3) {
    const moving = choice.activity ? getActivity(choice.activity).moving : false;
    return (
      <section>
        <StepHeader step={3} total={TOTAL} title="Jak chcesz rozmawiać?" onBack={back} />
        <div role="radiogroup" aria-label="Tryb rozmowy" className="flex flex-col gap-3">
          <ChoiceTile
            label={MODE_LABELS.video}
            description="Widzicie się nawzajem."
            icon={Video}
            selected={choice.mode === "video"}
            onSelect={() => {
              setChoice((c) => ({ ...c, mode: "video" }));
              setStep(4);
            }}
          />
          <ChoiceTile
            label={MODE_LABELS.audio}
            description={moving ? "Wygodne w ruchu – telefon może być w kieszeni." : "Bez kamery, tylko rozmowa."}
            icon={Headphones}
            selected={choice.mode === "audio"}
            onSelect={() => {
              setChoice((c) => ({ ...c, mode: "audio" }));
              setStep(4);
            }}
          />
        </div>
      </section>
    );
  }

  const ready = choice.activity && choice.duration && choice.mode;
  return (
    <section>
      <StepHeader
        step={4}
        total={TOTAL}
        title="Twój cel na tę sesję"
        hint="Nieobowiązkowe. Jedno zdanie wystarczy – partner je zobaczy."
        onBack={back}
      />
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onSubmit({ ...(choice as SessionChoice), goal: (choice.goal ?? "").trim() });
        }}
      >
        <label htmlFor="goal" className="sr-only">
          Cel sesji
        </label>
        <input
          id="goal"
          name="goal"
          maxLength={120}
          placeholder="np. Umyć okna w kuchni"
          value={choice.goal ?? ""}
          onChange={(e) => setChoice((c) => ({ ...c, goal: e.target.value }))}
          className="min-h-14 rounded-xl border-2 border-border bg-surface px-4 text-lg"
        />
        {ready && (
          <p className="text-muted">
            {getActivity(choice.activity!).label} · {choice.duration} min · {MODE_LABELS[choice.mode!]}
          </p>
        )}
        <Button type="submit" block disabled={!ready || pending}>
          {submitLabel}
        </Button>
      </form>
    </section>
  );
}
