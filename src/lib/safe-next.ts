/** Zezwala tylko na ścieżki względne w obrębie aplikacji (ochrona przed open redirect). */
export function safeNext(value: string | null | undefined, fallback = "/start"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
