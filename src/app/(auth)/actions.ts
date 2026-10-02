"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/env";
import { safeNext } from "@/lib/safe-next";
import { supabaseServer } from "@/lib/supabase/server";
import { validateDisplayName, validateEmail, validatePassword } from "@/lib/validation";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<"email" | "password" | "displayName" | "terms", string>>;
  values?: { email?: string; displayName?: string };
};

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export async function signUp(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").trim();
  const password = str(fd, "password");
  const displayName = str(fd, "displayName").trim();
  const terms = fd.get("terms") === "on";

  const errors: FormState["errors"] = {};
  const e1 = validateEmail(email);
  const e2 = validatePassword(password);
  const e3 = validateDisplayName(displayName);
  if (e1) errors.email = e1;
  if (e2) errors.password = e2;
  if (e3) errors.displayName = e3;
  if (!terms) errors.terms = "Aby założyć konto, zaakceptuj regulamin i politykę prywatności.";
  if (Object.keys(errors).length) return { errors, values: { email, displayName } };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/start`,
      data: { display_name: displayName, accepted_terms_at: new Date().toISOString() },
    },
  });

  // Nie ujawniamy, czy konto o tym adresie już istnieje.
  if (error && !/registered|exists/i.test(error.message)) {
    if (/password/i.test(error.message)) {
      return { errors: { password: "To hasło jest za słabe. Wybierz dłuższe." }, values: { email, displayName } };
    }
    return { message: "Nie udało się założyć konta. Spróbuj ponownie za chwilę.", values: { email, displayName } };
  }
  // Gdy potwierdzanie e-maila jest wyłączone (np. lokalnie), od razu mamy sesję.
  if (data?.session) redirect("/start");
  return { ok: true, message: "Sprawdź skrzynkę – wysłaliśmy link potwierdzający." };
}

export async function signInWithPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").trim();
  const password = str(fd, "password");
  const next = safeNext(str(fd, "next"));
  if (validateEmail(email) || !password) {
    return { message: "Wpisz e-mail i hasło.", values: { email } };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) {
      return { message: "Najpierw potwierdź adres e-mail – link jest w Twojej skrzynce.", values: { email } };
    }
    return { message: "Nieprawidłowy e-mail lub hasło.", values: { email } };
  }
  redirect(next);
}

export async function sendMagicLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").trim();
  const next = safeNext(str(fd, "next"));
  const err = validateEmail(email);
  if (err) return { errors: { email: err }, values: { email } };
  const supabase = await supabaseServer();
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  return { ok: true, message: "Jeśli masz u nas konto, link do logowania jest już w Twojej skrzynce." };
}

export async function signInWithGoogle(fd: FormData) {
  const next = safeNext(str(fd, "next"));
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/logowanie?blad=google");
  redirect(data.url);
}

export async function requestPasswordReset(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").trim();
  const err = validateEmail(email);
  if (err) return { errors: { email: err }, values: { email } };
  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/nowe-haslo` });
  return { ok: true, message: "Jeśli masz u nas konto, wysłaliśmy link do ustawienia nowego hasła." };
}

export async function setNewPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const password = str(fd, "password");
  const err = validatePassword(password);
  if (err) return { errors: { password: err } };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { message: "Link wygasł. Poproś o nowy link do zmiany hasła." };
  redirect("/start");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

export async function acceptTerms(_prev: FormState, fd: FormData): Promise<FormState> {
  const displayName = str(fd, "displayName").trim();
  const next = safeNext(str(fd, "next"));
  const errors: FormState["errors"] = {};
  const nameError = validateDisplayName(displayName);
  if (nameError) errors.displayName = nameError;
  if (fd.get("terms") !== "on") errors.terms = "Aby korzystać z aplikacji, zaakceptuj regulamin i politykę prywatności.";
  if (Object.keys(errors).length) return { errors, values: { displayName } };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("accept_terms", { p_display_name: displayName });
  if (error) return { message: "Nie udało się zapisać. Spróbuj ponownie.", values: { displayName } };
  redirect(next);
}
