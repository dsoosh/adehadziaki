import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Wąska kolumna treści – jeden temat na ekran. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto flex w-full max-w-xl flex-1 animate-view-in flex-col px-4 py-6 sm:py-10", className)}>{children}</main>;
}
