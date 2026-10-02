import Link from "next/link";
import type { ReactNode } from "react";
import { Notice } from "@/components/ui/notice";
import { Page } from "@/components/ui/page";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Page className="gap-6">
      <Link href="/" className="self-start text-lg font-bold text-accent">
        Adehadziaki
      </Link>
      <h1 className="text-3xl font-bold">{title}</h1>
      <Notice tone="warning">Wersja robocza na czas testów. Przed publicznym startem przejdzie weryfikację prawną.</Notice>
      <div className="flex flex-col gap-4 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </Page>
  );
}
