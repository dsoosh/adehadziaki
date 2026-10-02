"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, Video } from "lucide-react";
import { getActivity, MODE_LABELS, type CallMode } from "@/lib/activities";
import { VIDEO_ENABLED } from "@/lib/features";
import type { LobbyData } from "@/lib/lobby-types";
import { supabaseBrowser } from "@/lib/supabase/client";
import { dayLabel, formatElapsed, formatTime } from "@/lib/time";

const REFRESH_MS = 5000;

/** Lista osób czekających na partnera – teraz i na zaplanowane godziny. */
export function Lobby() {
  const [data, setData] = useState<LobbyData | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: res, error } = await supabaseBrowser().rpc("lobby");
      if (active && !error && res) setData(res as LobbyData);
    }
    void load();
    const refresh = setInterval(load, REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, []);

  if (!data) return null;
  const nowDate = new Date(now);

  return (
    <div className="mt-10 flex flex-col gap-8">
      <section aria-labelledby="lobby-now">
        <h2 id="lobby-now" className="mb-1 text-2xl font-bold">
          Czekają teraz
        </h2>
        <p className="mb-4 text-muted">Dotknij, żeby od razu zacząć sesję z tą osobą.</p>
        {data.now.length === 0 ? (
          <p className="rounded-2xl bg-surface-2 p-4 text-muted">
            Nikt teraz nie czeka. Zacznij sesję – ktoś może dołączyć do Ciebie.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.now.map((e) => (
              <li key={e.ticket}>
                <LobbyCard
                  href={`/dolacz?ticket=${e.ticket}`}
                  name={e.name}
                  activity={e.activity}
                  duration={e.duration}
                  mode={e.mode}
                  aside={`czeka ${formatElapsed(now - new Date(e.since).getTime())}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.scheduled.length > 0 && (
        <section aria-labelledby="lobby-scheduled">
          <h2 id="lobby-scheduled" className="mb-1 text-2xl font-bold">
            Zaplanowane – szukają partnera
          </h2>
          <p className="mb-4 text-muted">Zapisz się, a przypomnimy Ci przed startem.</p>
          <ul className="flex flex-col gap-3">
            {data.scheduled.map((e) => {
              const start = new Date(e.slot_start);
              return (
                <li key={e.booking_id}>
                  <LobbyCard
                    href={`/dolacz?booking=${e.booking_id}`}
                    name={e.name}
                    activity={e.activity}
                    duration={e.duration}
                    mode={e.mode}
                    aside={`${dayLabel(start, nowDate)} ${formatTime(start)}`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export function LobbyCard(props: {
  href?: string;
  name: string;
  activity: string;
  duration: number;
  mode: CallMode;
  aside: string;
}) {
  const activity = getActivity(props.activity);
  const ModeIcon = props.mode === "audio" ? Headphones : Video;
  const content = (
    <>
      <activity.icon aria-hidden className="size-8 shrink-0 text-accent" strokeWidth={1.75} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-lg font-bold">{props.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-muted">
          {activity.label} · {props.duration} min
          {VIDEO_ENABLED && (
            <span className="inline-flex items-center gap-1">
              · <ModeIcon aria-hidden className="size-4" /> {MODE_LABELS[props.mode]}
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-right text-base font-bold text-muted tabular-nums first-letter:uppercase">
        {props.aside}
      </span>
    </>
  );
  const cls = "flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 border-border bg-surface px-4 py-3";
  return props.href ? (
    <Link href={props.href} className={`pressable ${cls} hover:border-accent`}>
      {content}
    </Link>
  ) : (
    <div className={cls}>{content}</div>
  );
}
