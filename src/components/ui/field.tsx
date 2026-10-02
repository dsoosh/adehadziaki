import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = ComponentProps<"input"> & { label: string; hint?: string; error?: string };

export function Field({ label, hint, error, id, name, className, ...props }: Props) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="font-bold">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          "min-h-14 rounded-xl border-2 bg-surface px-4 text-lg text-text",
          error ? "border-danger" : "border-border",
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-base text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-base font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
