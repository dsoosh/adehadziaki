import { ArrowLeft } from "lucide-react";

type Props = {
  step: number;
  total: number;
  title: string;
  hint?: string;
  onBack?: () => void;
};

export function StepHeader({ step, total, title, hint, onBack }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 inline-flex min-h-12 items-center gap-2 rounded-xl px-2 font-bold text-text hover:bg-surface-2"
          >
            <ArrowLeft aria-hidden className="size-5" /> Wstecz
          </button>
        ) : (
          <span />
        )}
        <span className="text-base text-muted">
          Krok {step} z {total}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="Postęp"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      {hint && <p className="text-muted">{hint}</p>}
    </header>
  );
}
