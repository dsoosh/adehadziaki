import { NextResponse } from "next/server";
import { createMeetingToken, dailyConfigured, ensureRoom } from "@/lib/daily";
import { canIssueToken } from "@/lib/session-phase";
import type { JoinResponse, SessionDetails } from "@/lib/session-types";
import { supabaseServer } from "@/lib/supabase/server";

/** Wydaje dostęp do pokoju rozmowy wyłącznie uczestnikom sesji, w oknie czasowym sesji. */
export async function POST(_req: Request, ctx: RouteContext<"/api/sessions/[id]/join">) {
  const { id } = await ctx.params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json<JoinResponse>({ error: "Zaloguj się ponownie." }, { status: 401 });

  const { data } = await supabase.rpc("get_session", { p_session: id });
  const session = data as SessionDetails | null;
  if (!session) return NextResponse.json<JoinResponse>({ error: "To nie jest Twoja sesja." }, { status: 404 });

  const startsAt = new Date(session.starts_at);
  const endsAt = new Date(session.ends_at);
  if (!canIssueToken(startsAt, endsAt, new Date())) {
    return NextResponse.json<JoinResponse>({ error: "Pokój jest teraz zamknięty." }, { status: 409 });
  }

  if (!dailyConfigured()) return NextResponse.json<JoinResponse>({ demo: true });

  try {
    const room = await ensureRoom(session.id, endsAt);
    await supabase.rpc("set_session_room", { p_session: session.id, p_room: room.name });
    const token = await createMeetingToken({
      roomName: room.name,
      userName: session.me.name,
      userId: user.id,
      endsAt,
      audioOnly: session.mode === "audio",
    });
    return NextResponse.json<JoinResponse>({ demo: false, url: room.url, token });
  } catch (err) {
    console.error(err);
    return NextResponse.json<JoinResponse>(
      { error: "Nie udało się otworzyć pokoju. Spróbuj ponownie za chwilę." },
      { status: 502 },
    );
  }
}
