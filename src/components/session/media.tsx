"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export function VideoTile({ track, mirror, className }: { track: MediaStreamTrack | null; mirror?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = track ? new MediaStream([track]) : null;
  }, [track]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={cn("h-full w-full rounded-2xl bg-surface-2 object-cover", mirror && "-scale-x-100", className)}
    />
  );
}

/**
 * Dźwięk partnera. Do 100% zwykły element <audio>; powyżej – wzmocnienie przez
 * Web Audio (GainNode), bo element nie potrafi grać głośniej niż 100%.
 * Element zostaje wtedy wyciszony – Chrome wymaga podpięcia zdalnej ścieżki
 * do elementu, żeby Web Audio dostało dźwięk.
 */
export function AudioSink({ track, volume = 1 }: { track: MediaStreamTrack | null; volume?: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const boosted = volume > 1;

  useEffect(() => {
    if (ref.current) ref.current.srcObject = track ? new MediaStream([track]) : null;
  }, [track]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = boosted;
    if (!boosted) el.volume = Math.max(0, Math.min(1, volume));
  }, [boosted, volume]);

  const ctxRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  useEffect(() => {
    if (!boosted || !track) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    ctx.createMediaStreamSource(new MediaStream([track])).connect(gain).connect(ctx.destination);
    ctxRef.current = { ctx, gain };
    void ctx.resume();
    return () => {
      ctxRef.current = null;
      void ctx.close();
    };
  }, [boosted, track]);

  useEffect(() => {
    if (ctxRef.current) ctxRef.current.gain.gain.value = volume;
  }, [volume, boosted, track]);

  return <audio ref={ref} autoPlay />;
}

export function Avatar({ name, speaking }: { name?: string | null; speaking?: boolean }) {
  return (
    <div
      className={cn(
        "flex size-28 items-center justify-center rounded-full bg-accent-soft text-4xl font-bold text-accent",
        speaking && "ring-4 ring-accent",
      )}
      aria-hidden
    >
      {name?.trim().slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}

/** Delikatny sygnał: krótki dźwięk i wibracja. */
export function gentleSignal() {
  try {
    navigator.vibrate?.([120, 80, 120]);
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
    osc.onended = () => void ctx.close();
  } catch {
    // brak dźwięku nie jest krytyczny
  }
}
