import "server-only";

const API = "https://api.daily.co/v1";

export function dailyConfigured(): boolean {
  return Boolean(process.env.DAILY_API_KEY);
}

async function daily<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

/** Pokój ma deterministyczną nazwę, więc równoczesne wejście obu osób nie tworzy dwóch pokoi. */
export function roomNameFor(sessionId: string): string {
  return `adh-${sessionId}`;
}

export async function ensureRoom(sessionId: string, endsAt: Date): Promise<{ name: string; url: string }> {
  const name = roomNameFor(sessionId);
  const exp = Math.floor(endsAt.getTime() / 1000) + 5 * 60;
  const created = await daily<{ name: string; url: string; error?: string; info?: string }>("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: {
        exp,
        max_participants: 2,
        eject_at_room_exp: true,
        enable_prejoin_ui: false,
        enable_chat: false,
        enable_screenshare: false,
        geo: "eu-central-1",
      },
    }),
  });
  if (created.ok) return { name: created.data.name, url: created.data.url };

  // Pokój już istnieje (drugi uczestnik) – pobieramy jego adres.
  const existing = await daily<{ name: string; url: string }>(`/rooms/${name}`);
  if (existing.ok) return { name: existing.data.name, url: existing.data.url };
  throw new Error(`Daily: nie udało się utworzyć pokoju (${created.status})`);
}

export async function createMeetingToken(opts: {
  roomName: string;
  userName: string;
  userId: string;
  endsAt: Date;
  audioOnly: boolean;
}): Promise<string> {
  const res = await daily<{ token: string }>("/meeting-tokens", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: opts.roomName,
        user_name: opts.userName,
        user_id: opts.userId,
        exp: Math.floor(opts.endsAt.getTime() / 1000) + 5 * 60,
        eject_at_token_exp: true,
        start_video_off: opts.audioOnly,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily: nie udało się wystawić tokenu (${res.status})`);
  return res.data.token;
}
