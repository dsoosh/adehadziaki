import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  info: "border-accent bg-accent-soft",
  success: "border-success bg-success-soft",
  warning: "border-warning bg-warning-soft",
  danger: "border-danger bg-danger-soft",
};

export function Notice({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-2xl border-l-4 px-5 py-4", tones[tone], className)}
    >
      {children}
    </div>
  );
}
