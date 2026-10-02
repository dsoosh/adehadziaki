import type { Metadata } from "next";
import { ScheduleFlow } from "@/components/session/schedule-flow";
import { Page } from "@/components/ui/page";
import { choiceFromSearch } from "@/lib/session-params";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zaplanuj sesję" };

export default async function SchedulePage(props: PageProps<"/zaplanuj">) {
  const { profile } = await requireUser("/zaplanuj");
  const sp = await props.searchParams;
  const slot = typeof sp.slot === "string" && !Number.isNaN(Date.parse(sp.slot)) ? sp.slot : undefined;
  return (
    <Page>
      <ScheduleFlow
        profileMode={profile?.default_mode ?? "video"}
        initial={choiceFromSearch(sp)}
        preselectedSlot={slot}
        pushEnabled={profile?.push_enabled ?? false}
      />
    </Page>
  );
}
