"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyCall, DailyParticipant } from "@daily-co/daily-js";
import { Bell, BellOff, Copy, Flag, Headphones, Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from "lucide-react";
import { getActivity, MODE_LABELS } from "@/lib/activities";
import { micOptions, OUTPUT_LABELS, preferredMic, type MicOption } from "@/lib/audio-devices";
import { NETWORK_ERROR } from "@/lib/errors";
import { PHASE_COPY, partnerNoShow, roomWindow, sessionPhase } from "@/lib/session-phase";
import { choiceToSearch } from "@/lib/session-params";
import type { JoinResponse, SessionDetails } from "@/lib/session-types";
import { formatClock, formatTime } from "@/lib/time";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChoiceTile } from "@/components/ui/choice-tile";
import { Notice } from "@/components/ui/notice";
import { AudioSink, Avatar, VideoTile, gentleSignal } from "./media";
import { ReportForm } from "./report-form";

type Stage = "prejoin" | "requesting" | "denied" | "joining" | "in-call" | "error";

type Remote = { name: string; video: MediaStreamTrack | null; audio: MediaStreamTrack | null };

const SOUND_KEY = "adh:end-signal";

function readSoundPref(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Mikrofon o podanym id (lub domyślny), z redukcją echa i szumów. */
function micConstraints(deviceId?: string): MediaTrackConstraints {
  return { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), echoCancellation: true, noiseSuppression: true, autoGainControl: true };
}

/** Znacznik czasu dla handlerów zdarzeń (poza renderem). */
const timestamp = () => Date.now();

function playable(p: DailyParticipant | undefined, kind: "video" | "audio"): MediaStreamTrack | null {
  const t = p?.tracks?.[kind];
  return t && (t.state === "playable" || t.state === "loading") ? (t.persistentTrack ?? null) : null;
}

export function Room({ session }: { session: SessionDetails }) {
  const router = useRouter();
  const startsAt = new Date(session.starts_at);
  const endsAt = new Date(session.ends_at);
  const isVideo = session.mode === "video";

  const [now, setNow] = useState(() => new Date());
  const [stage, setStage] = useState<Stage>("prejoin");
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remote, setRemote] = useState<Remote | null>(null);
  const [partnerEverJoined, setPartnerEverJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(isVideo);
  const [soundOn, setSoundOn] = useState(readSoundPref);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [mics, setMics] = useState<MicOption[]>([]);
  const [micId, setMicId] = useState<string | undefined>(undefined);
  const [audioPanel, setAudioPanel] = useState(false);
  // Stan połączenia z Daily – widoczny dla użytkownika, pomaga też w diagnozie.
  const [inRoom, setInRoom] = useState(0);
  const [netInterrupted, setNetInterrupted] = useState(false);
  const [joinedAt, setJoinedAt] = useState<number | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const credsRef = useRef<{ url: string; token: string } | null>(null);
  const [reporting, setReporting] = useState(false);
  const callRef = useRef<DailyCall | null>(null);
  const reconnectingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const signalled = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /**
   * Zwalnia mikrofon i kamerę. Strumień jest w refie, a nie tylko w stanie:
   * przy wyjściu ze strony komponent jest odmontowywany i aktualizacje stanu
   * nie są już wykonywane, więc zatrzymanie musi nastąpić bezpośrednio.
   */
  const teardown = useCallback(async () => {
    const call = callRef.current;
    callRef.current = null;
    const tracks = new Set<MediaStreamTrack>(streamRef.current?.getTracks() ?? []);
    streamRef.current = null;
    if (call) {
      // Daily mogło użyć kopii ścieżek – zatrzymujemy też te z lokalnego uczestnika.
      const local = call.participants()?.local;
      for (const t of [local?.tracks?.audio?.persistentTrack, local?.tracks?.video?.persistentTrack]) if (t) tracks.add(t);
    }
    tracks.forEach((t) => t.stop());
    setLocalStream(null);
    if (call) {
      await call.leave().catch(() => undefined);
      await call.destroy().catch(() => undefined);
    }
  }, []);

  useEffect(() => () => void teardown(), [teardown]);

  const finish = useCallback(
    async (suffix = "") => {
      if (finished.current) return;
      finished.current = true;
      await teardown();
      router.push(`/sesja/${session.id}/koniec${suffix}`);
    },
    [router, session.id, teardown],
  );

  const win = roomWindow(startsAt, endsAt, now);
  const phase = sessionPhase(startsAt, endsAt, now);

  // Koniec czasu – rozłączamy i przechodzimy do podsumowania.
  useEffect(() => {
    if (stage === "in-call" && phase.phase === "done") void finish();
  }, [stage, phase.phase, finish]);

  // Delikatny sygnał 2 minuty przed końcem.
  useEffect(() => {
    if (stage === "in-call" && phase.ending && phase.phase !== "done" && !signalled.current) {
      signalled.current = true;
      if (soundOn) gentleSignal();
    }
  }, [stage, phase.ending, phase.phase, soundOn]);

  const syncParticipants = useCallback((call: DailyCall) => {
    const all = call.participants();
    setInRoom(Object.keys(all).length);
    const other = Object.values(all).find((p) => !p.local);
    if (other) {
      setPartnerEverJoined(true);
      setRemote({ name: session.partner.name, video: playable(other, "video"), audio: playable(other, "audio") });
    } else {
      setRemote(null);
    }
  }, [session.partner.name]);

  async function join() {
    setError(null);
    setStage("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: micConstraints(), video: isVideo });
      stream = await preferHeadsetMic(stream);
    } catch (err) {
      const name = (err as DOMException).name;
      setStage(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      if (name === "NotFoundError") setError(isVideo ? "Nie znaleźliśmy mikrofonu lub kamery." : "Nie znaleźliśmy mikrofonu.");
      return;
    }
    streamRef.current = stream;
    setLocalStream(stream);
    setStage("joining");

    let res: JoinResponse;
    try {
      const r = await fetch(`/api/sessions/${session.id}/join`, { method: "POST" });
      res = (await r.json()) as JoinResponse;
    } catch {
      res = { error: NETWORK_ERROR };
    }
    if ("error" in res) {
      setError(res.error);
      setStage("error");
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLocalStream(null);
      return;
    }
    if (res.demo) {
      setDemo(true);
      setStage("in-call");
      return;
    }

    try {
      const { default: Daily } = await import("@daily-co/daily-js");
      const call = Daily.createCallObject({
        audioSource: stream.getAudioTracks()[0] ?? true,
        videoSource: isVideo ? (stream.getVideoTracks()[0] ?? true) : false,
        subscribeToTracksAutomatically: true,
      });
      callRef.current = call;
      const sync = () => syncParticipants(call);
      call
        .on("participant-joined", sync)
        .on("participant-updated", sync)
        .on("participant-left", sync)
        .on("track-started", sync)
        .on("track-stopped", sync)
        .on("network-connection", (ev) => {
          console.info("[adh] network-connection", ev?.type, ev?.event);
          setNetInterrupted(ev?.event === "interrupted");
        })
        .on("nonfatal-error", (ev) => console.warn("[adh] daily nonfatal-error", ev))
        .on("left-meeting", () => {
          if (!reconnectingRef.current) void finish();
        })
        .on("error", (ev) => {
          console.error("[adh] daily error", ev);
          setError("Połączenie zostało przerwane. Spróbuj dołączyć ponownie.");
          setStage("error");
        });
      credsRef.current = { url: res.url, token: res.token };
      await call.join({ url: res.url, token: res.token });
      console.info("[adh] joined", res.url, "osób w pokoju:", Object.keys(call.participants()).length);
      sync();
      setJoinedAt(timestamp());
      setStage("in-call");
    } catch {
      setError("Nie udało się połączyć z pokojem. Sprawdź internet i spróbuj ponownie.");
      setStage("error");
      await teardown();
    }
  }

  /**
   * Wybiera najlepsze miejsce dźwięku: słuchawki Bluetooth → przewodowe →
   * telefon przy uchu → głośnik. Na Androidzie dźwięk rozmowy idzie tam,
   * gdzie jest wybrany mikrofon.
   */
  async function preferHeadsetMic(stream: MediaStream): Promise<MediaStream> {
    const current = stream.getAudioTracks()[0];
    let options: MicOption[] = [];
    try {
      options = micOptions(await navigator.mediaDevices.enumerateDevices());
    } catch {
      return stream;
    }
    setMics(options);
    const currentId = current?.getSettings().deviceId;
    const target = preferredMic(options, currentId);
    setMicId(target ?? currentId);
    if (!target) return stream;
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ audio: micConstraints(target) });
      current?.stop();
      return new MediaStream([...fresh.getAudioTracks(), ...stream.getVideoTracks()]);
    } catch {
      return stream;
    }
  }

  async function switchMic(deviceId: string) {
    setMicId(deviceId);
    let fresh: MediaStream;
    try {
      fresh = await navigator.mediaDevices.getUserMedia({ audio: micConstraints(deviceId) });
    } catch {
      setError("Nie udało się przełączyć mikrofonu. Spróbuj wybrać inny.");
      return;
    }
    const track = fresh.getAudioTracks()[0];
    track.enabled = micOn;
    const old = streamRef.current;
    old?.getAudioTracks().forEach((t) => t.stop());
    const next = new MediaStream([track, ...(old?.getVideoTracks() ?? [])]);
    streamRef.current = next;
    setLocalStream(next);
    await callRef.current?.setInputDevicesAsync({ audioSource: track }).catch(() => undefined);
  }

  // Zabezpieczenie: co 2 s czytamy stan pokoju wprost z Daily, gdyby zdarzenie się zgubiło.
  useEffect(() => {
    if (stage !== "in-call" || demo) return;
    const t = setInterval(() => {
      const call = callRef.current;
      if (call && call.meetingState() === "joined-meeting") syncParticipants(call);
    }, 2000);
    return () => clearInterval(t);
  }, [stage, demo, syncParticipants]);

  async function reconnect() {
    const call = callRef.current;
    const creds = credsRef.current;
    if (!call || !creds) return;
    setReconnecting(true);
    reconnectingRef.current = true;
    try {
      await call.leave();
      await call.join(creds);
      syncParticipants(call);
      setJoinedAt(timestamp());
      setNetInterrupted(false);
    } catch (err) {
      console.error("[adh] reconnect", err);
      setError("Nie udało się połączyć ponownie. Wyjdź i dołącz jeszcze raz.");
    } finally {
      reconnectingRef.current = false;
      setReconnecting(false);
    }
  }

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    callRef.current?.setLocalAudio(next);
    localStream?.getAudioTracks().forEach((t) => (t.enabled = next));
  }

  function toggleCam() {
    const next = !camOn;
    setCamOn(next);
    callRef.current?.setLocalVideo(next);
    localStream?.getVideoTracks().forEach((t) => (t.enabled = next));
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // preferencja tylko na tę wizytę
    }
  }

  const partnerActivity = getActivity(session.partner.activity);
  const myActivity = getActivity(session.me.activity);
  const findAnother = `/teraz?${choiceToSearch({
    activity: myActivity.id,
    duration: session.duration,
    mode: session.mode,
    goal: session.me.goal ?? "",
  })}&auto=1`;

  // --- Przed otwarciem i po zakończeniu -------------------------------------

  if (win === "too_early" && stage === "prejoin") {
    return (
      <section className="flex flex-col gap-6 text-center">
        <h1 className="text-3xl font-bold">Pokój otworzy się 5 minut przed startem</h1>
        <p className="text-6xl font-bold tabular-nums">{formatClock(startsAt.getTime() - 5 * 60_000 - now.getTime())}</p>
        <p className="text-muted">Start o {formatTime(startsAt)}. Możesz zostawić tę stronę otwartą.</p>
        <ButtonLink href="/sesje" variant="secondary">
          Wróć do moich sesji
        </ButtonLink>
      </section>
    );
  }

  if (win === "ended" && stage !== "in-call") {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Ta sesja już się zakończyła</h1>
        <ButtonLink href={`/sesja/${session.id}/koniec`} block>
          Przejdź do podsumowania
        </ButtonLink>
        <ButtonLink href="/start" variant="secondary" block>
          Nowa sesja
        </ButtonLink>
      </section>
    );
  }

  // --- Zgłoszenie -------------------------------------------------------------

  if (reporting) {
    return (
      <section>
        <ReportForm sessionId={session.id} onDone={() => void finish("?zgloszono=1")} onCancel={() => setReporting(false)} />
      </section>
    );
  }

  const isTest = session.kind === "test";
  const testNotice = isTest && <TestSessionNotice />;

  const partnerCard = (
    <Card className="flex flex-col gap-1">
      <p className="text-sm text-muted">Twój partner</p>
      <p className="text-xl font-bold">{session.partner.name}</p>
      <p>{partnerActivity.label}</p>
      {session.partner.goal && <p className="text-muted">Cel: {session.partner.goal}</p>}
    </Card>
  );

  // --- Przed dołączeniem --------------------------------------------------------

  if (stage !== "in-call") {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Gotowy do sesji?</h1>
        {testNotice}
        {partnerCard}
        <p className="text-muted">
          {myActivity.label} · {session.duration} min · {MODE_LABELS[session.mode]}
        </p>
        <Notice>
          {isVideo
            ? "Przeglądarka zapyta o dostęp do mikrofonu i kamery – są potrzebne, żeby partner Cię słyszał i widział. Nic nie nagrywamy."
            : "Przeglądarka zapyta o dostęp do mikrofonu – jest potrzebny, żeby partner Cię słyszał. Nic nie nagrywamy."}
        </Notice>
        {stage === "denied" && (
          <Notice tone="warning">
            <p className="font-bold">Brak dostępu do {isVideo ? "mikrofonu lub kamery" : "mikrofonu"}.</p>
            <p>
              Kliknij ikonę kłódki obok adresu strony i zezwól na {isVideo ? "mikrofon i kamerę" : "mikrofon"}. Na
              telefonie sprawdź też ustawienia przeglądarki w systemie.
            </p>
          </Notice>
        )}
        {error && <Notice tone="danger">{error}</Notice>}
        <Button block onClick={join} disabled={stage === "requesting" || stage === "joining"}>
          {stage === "requesting" || stage === "joining"
            ? "Łączenie…"
            : stage === "denied" || stage === "error"
              ? "Spróbuj ponownie"
              : "Dołącz do sesji"}
        </Button>
      </section>
    );
  }

  // --- W trakcie rozmowy ----------------------------------------------------------

  const copy = PHASE_COPY[phase.phase];
  const noShow = partnerNoShow(startsAt, now, partnerEverJoined);
  const localVideo = localStream?.getVideoTracks()[0] ?? null;

  return (
    <section className="flex flex-col gap-5">
      {remote?.audio && <AudioSink track={remote.audio} />}
      {testNotice}

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-bold text-accent">{copy.title}</p>
        <p
          className="text-6xl font-bold tabular-nums"
          role="timer"
          aria-label={`Zostało ${Math.ceil(phase.remainingMs / 60_000)} minut`}
        >
          {formatClock(phase.remainingMs)}
        </p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full rounded-full bg-accent" style={{ width: `${phase.progress * 100}%` }} />
        </div>
        <p className="text-muted">{copy.hint}</p>
      </div>

      {demo && (
        <Notice tone="warning">Tryb demonstracyjny: połączenie wideo nie jest skonfigurowane, partner Cię nie słyszy.</Notice>
      )}

      {!demo && (
        <p className="text-center text-base text-muted" role="status">
          {netInterrupted
            ? "Połączenie przerwane – próbujemy wznowić…"
            : `Połączono z pokojem · osób w pokoju: ${Math.min(inRoom, 2)} z 2`}
        </p>
      )}

      {!demo && !remote && !noShow && joinedAt !== null && now.getTime() - joinedAt > 20_000 && (
        <Notice>
          <p className="mb-3">
            Wciąż czekamy na: {session.partner.name}. Jeśli oboje jesteście już w pokoju, a się nie widzicie, połącz się
            ponownie.
          </p>
          <Button variant="secondary" onClick={() => void reconnect()} disabled={reconnecting}>
            <RefreshCw aria-hidden className="size-5" /> {reconnecting ? "Łączę…" : "Połącz ponownie"}
          </Button>
        </Notice>
      )}

      {noShow && !remote && (
        <Notice tone="warning">
          <p className="mb-3 font-bold">Partner się nie pojawił.</p>
          <Button
            onClick={async () => {
              finished.current = true;
              await teardown();
              router.push(findAnother);
            }}
          >
            Znajdź kogoś innego
          </Button>
        </Notice>
      )}

      {isVideo ? (
        <div className="relative aspect-[3/4] w-full sm:aspect-video">
          {remote?.video ? (
            <VideoTile track={remote.video} />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-surface-2">
              <Avatar name={session.partner.name} />
              <p className="text-muted">{remote ? `${remote.name} ma wyłączoną kamerę` : `Czekamy na: ${session.partner.name}`}</p>
            </div>
          )}
          <div className="absolute right-3 bottom-3 h-32 w-24 overflow-hidden rounded-xl border-2 border-surface shadow sm:h-28 sm:w-40">
            {camOn && localVideo ? <VideoTile track={localVideo} mirror /> : <div className="h-full w-full bg-surface-2" />}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-around rounded-2xl bg-surface-2 py-8">
          <div className="flex flex-col items-center gap-2">
            <Avatar name={session.me.name} />
            <p className="font-bold">Ty</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            {/* Przygaszony tylko awatar – tekst musi zachować pełny kontrast. */}
            <div className={cn(!remote && "opacity-50")}>
              <Avatar name={session.partner.name} />
            </div>
            <p className={cn("font-bold", !remote && "text-muted")}>{remote ? remote.name : "Czekamy…"}</p>
          </div>
        </div>
      )}

      {partnerCard}

      <div className="grid grid-cols-3 gap-3">
        <Button variant={micOn ? "secondary" : "primary"} onClick={toggleMic} aria-pressed={!micOn}>
          {micOn ? <Mic aria-hidden /> : <MicOff aria-hidden />}
          <span className="sr-only sm:not-sr-only">{micOn ? "Wycisz" : "Włącz mikrofon"}</span>
        </Button>
        {isVideo ? (
          <Button variant={camOn ? "secondary" : "primary"} onClick={toggleCam} aria-pressed={!camOn}>
            {camOn ? <Video aria-hidden /> : <VideoOff aria-hidden />}
            <span className="sr-only sm:not-sr-only">{camOn ? "Wyłącz kamerę" : "Włącz kamerę"}</span>
          </Button>
        ) : (
          <Button variant="secondary" onClick={toggleSound} aria-pressed={soundOn}>
            {soundOn ? <Bell aria-hidden /> : <BellOff aria-hidden />}
            <span className="sr-only sm:not-sr-only">Sygnał końca</span>
          </Button>
        )}
        <Button variant="danger" onClick={() => setConfirmLeave(true)}>
          <PhoneOff aria-hidden />
          <span className="sr-only sm:not-sr-only">Zakończ</span>
        </Button>
      </div>

      {confirmLeave && (
        <Card className="flex flex-col gap-3">
          <p className="font-bold">Zakończyć sesję przed czasem?</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={() => void finish()}>
              Tak, zakończ
            </Button>
            <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
              Zostaję
            </Button>
          </div>
        </Card>
      )}

      {mics.length > 1 && (
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => setAudioPanel((v) => !v)} aria-expanded={audioPanel}>
            <Headphones aria-hidden /> Gdzie słychać partnera?
          </Button>
          {audioPanel && (
            <div role="radiogroup" aria-label="Gdzie słychać partnera" className="flex flex-col gap-2">
              {mics.map((m) => (
                <ChoiceTile
                  key={m.deviceId}
                  label={OUTPUT_LABELS[m.kind]}
                  description={m.label}
                  selected={micId === m.deviceId}
                  onSelect={() => void switchMic(m.deviceId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {isVideo && (
          <button type="button" onClick={toggleSound} className="flex min-h-12 items-center gap-2 text-muted">
            {soundOn ? <Bell aria-hidden className="size-5" /> : <BellOff aria-hidden className="size-5" />}
            Sygnał 2 min przed końcem: {soundOn ? "włączony" : "wyłączony"}
          </button>
        )}
        {!isTest && (
          <button type="button" onClick={() => setReporting(true)} className="flex min-h-12 items-center gap-2 text-muted">
            <Flag aria-hidden className="size-5" /> Zgłoś problem
          </button>
        )}
      </div>
    </section>
  );
}

/** Sesja testowa admina: drugi uczestnik to ten sam użytkownik na innym urządzeniu. */
function TestSessionNotice() {
  const [copied, setCopied] = useState(false);
  return (
    <Notice tone="warning">
      <p className="mb-3">
        <strong>Sesja testowa.</strong> Otwórz ten adres na drugim urządzeniu (albo w drugiej karcie) i dołącz tam –
        połączysz się sam ze sobą.
      </p>
      <Button
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        <Copy aria-hidden className="size-5" /> {copied ? "Skopiowano" : "Kopiuj link"}
      </Button>
    </Notice>
  );
}
