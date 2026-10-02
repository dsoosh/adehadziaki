import Link from "next/link";
import type { ReactNode } from "react";
import { Page } from "@/components/ui/page";

export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <Page>
      <Link href="/" className="mb-8 self-start text-lg font-bold text-accent">
        Adehadziaki
      </Link>
      <h1 className="mb-2 text-3xl font-bold">{title}</h1>
      {intro && <p className="mb-6 text-muted">{intro}</p>}
      {children}
    </Page>
  );
}
