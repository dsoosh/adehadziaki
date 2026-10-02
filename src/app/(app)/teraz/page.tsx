import type { Metadata } from "next";
import { InstantFlow } from "@/components/session/instant-flow";
import { Page } from "@/components/ui/page";
import { choiceFromSearch } from "@/lib/session-params";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zacznij teraz" };

export default async function NowPage(props: PageProps<"/teraz">) {
  const { profile } = await requireUser("/teraz");
  const sp = await props.searchParams;
  return (
    <Page>
      <InstantFlow
        profileMode={profile?.default_mode ?? "video"}
        initial={choiceFromSearch(sp)}
        autoStart={sp.auto === "1"}
      />
    </Page>
  );
}
