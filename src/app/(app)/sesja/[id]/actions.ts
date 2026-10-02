"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type Outcome = "udalo" | "czesciowo" | "nie";
export type ReportReason = "zachowanie" | "seksualne" | "obrazliwe" | "spam" | "inne";

const OUTCOMES: Outcome[] = ["udalo", "czesciowo", "nie"];
const REASONS: ReportReason[] = ["zachowanie", "seksualne", "obrazliwe", "spam", "inne"];

export async function submitFeedback(sessionId: string, outcome: Outcome): Promise<{ ok: boolean }> {
  if (!OUTCOMES.includes(outcome)) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("submit_feedback", { p_session: sessionId, p_outcome: outcome });
  revalidatePath(`/sesja/${sessionId}/koniec`);
  return { ok: !error };
}

export async function blockPartner(sessionId: string): Promise<{ ok: boolean }> {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("block_partner", { p_session: sessionId });
  revalidatePath(`/sesja/${sessionId}/koniec`);
  return { ok: !error };
}

export async function reportPartner(
  sessionId: string,
  reason: ReportReason,
  details: string,
): Promise<{ ok: boolean }> {
  if (!REASONS.includes(reason)) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("report_partner", {
    p_session: sessionId,
    p_reason: reason,
    p_details: details.slice(0, 1000) || null,
  });
  revalidatePath(`/sesja/${sessionId}/koniec`);
  return { ok: !error };
}
