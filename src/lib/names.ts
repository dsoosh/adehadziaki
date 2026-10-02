/**
 * Nazwa widoczna dla innych osób: imię + inicjał nazwiska („Anna K.”).
 * Ta sama logika co public.short_name w bazie.
 */
export function shortName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Partner";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}
