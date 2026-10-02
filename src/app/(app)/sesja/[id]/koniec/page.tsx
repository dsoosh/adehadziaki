import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AfterSession } from "@/components/session/after-session";
import { Page } from "@/components/ui/page";
import type { SessionDetails } from "@/lib/session-types";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Koniec sesji" };

export default async function AfterSessionPage(props: PageProps<"/sesja/[id]/koniec">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const { supabase } = await requireUser(`/sesja/${id}/koniec`);
  const { data } = await supabase.rpc("get_session", { p_session: id });
  const session = data as SessionDetails | null;
  if (!session) notFound();

  return (
    <Page>
      <AfterSession session={session} reported={sp.zgloszono === "1"} />
    </Page>
  );
}
