"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected?: boolean;
  onSelect: () => void;
};

/** Duży kafelek wyboru – jedna opcja, jedno dotknięcie. */
export function ChoiceTile({ label, description, icon: Icon, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected ?? false}
      onClick={onSelect}
      className={cn(
        "pressable flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left",
        selected
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface hover:border-accent",
      )}
    >
      {Icon && <Icon aria-hidden className="size-8 shrink-0 text-accent" strokeWidth={1.75} />}
      <span className="flex flex-col">
        <span className="text-lg font-bold">{label}</span>
        {description && <span className="text-base text-muted">{description}</span>}
      </span>
    </button>
  );
}
