import { Feather } from "lucide-react";
import { cn } from "@/lib/cn";

/** Piórko przy nazwie osoby z planem Plus (jak skrzydełka patrona w Lichess). */
export function PlusMark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Plus" title="Ma plan Plus" className={cn("inline-flex shrink-0 text-accent", className)}>
      <Feather aria-hidden className="size-[0.9em]" strokeWidth={2.25} />
    </span>
  );
}
