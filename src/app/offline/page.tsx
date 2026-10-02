import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Page } from "@/components/ui/page";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Brak internetu" };

export default function OfflinePage() {
  return (
    <Page className="items-center justify-center gap-6 text-center">
      <WifiOff aria-hidden className="size-16 text-muted" strokeWidth={1.5} />
      <h1 className="text-3xl font-bold">Brak internetu</h1>
      <p className="text-muted">Sesje wymagają połączenia. Sprawdź Wi-Fi lub dane komórkowe.</p>
      <RetryButton />
    </Page>
  );
}
