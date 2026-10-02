import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "pressable inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-text hover:opacity-90",
  secondary: "border-2 border-border bg-surface text-text hover:bg-surface-2",
  ghost: "text-text underline-offset-4 hover:underline",
  danger: "border-2 border-danger bg-surface text-danger hover:bg-danger-soft",
};

type CommonProps = { variant?: Variant; block?: boolean; className?: string; children: ReactNode };

export function Button({
  variant = "primary",
  block,
  className,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(base, variants[variant], block && "w-full", className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  block,
  className,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return <Link className={cn(base, variants[variant], block && "w-full", className)} {...props} />;
}
