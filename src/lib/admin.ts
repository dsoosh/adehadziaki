/** Administratorzy z listy ADMIN_EMAILS (po przecinku). Tylko po stronie serwera. */
export function isAdmin(email: string | null | undefined, list = process.env.ADMIN_EMAILS ?? ""): boolean {
  if (!email) return false;
  const admins = list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}
