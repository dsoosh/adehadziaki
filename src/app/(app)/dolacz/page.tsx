import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JoinFlow } from "@/components/session/join-flow";
import { Page } from "@/components/ui/page";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dołącz do sesji" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function JoinPage(props: PageProps<"/dolacz">) {
  const sp = await props.searchParams;
  const ticket = typeof sp.ticket === "string" && UUID.test(sp.ticket) ? sp.ticket : undefined;
  const booking = typeof sp.booking === "string" && UUID.test(sp.booking) ? sp.booking : undefined;
  const { profile } = await requireUser(`/dolacz?${ticket ? `ticket=${ticket}` : `booking=${booking}`}`);
  if (!ticket && !booking) redirect("/start");
  return (
    <Page>
      <JoinFlow ticket={ticket} bookingId={booking} pushEnabled={profile.push_enabled} />
    </Page>
  );
}
