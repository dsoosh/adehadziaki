import type { Metadata } from "next";
import { Room } from "@/components/session/room";
import { ButtonLink } from "@/components/ui/button";
import { Page } from "@/components/ui/page";
import type { SessionDetails } from "@/lib/session-types";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sesja" };

export default async function SessionPage(props: PageProps<"/sesja/[id]">) {
  const { id } = await props.params;
  const { supabase } = await requireUser(`/sesja/${id}`);
  const { data } = await supabase.rpc("get_session", { p_session: id });
  const session = data as SessionDetails | null;

  if (!session) {
    return (
      <Page className="gap-6">
        <h1 className="text-3xl font-bold">To nie jest Twoja sesja</h1>
        <p className="text-muted">Ten pokój jest dostępny tylko dla dwóch osób, które zostały połączone.</p>
        <ButtonLink href="/start" block>
          Wróć na start
        </ButtonLink>
      </Page>
    );
  }

  return (
    <Page>
      <Room session={session} />
    </Page>
  );
}
