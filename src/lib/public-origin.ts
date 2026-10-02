/**
 * Publiczny adres aplikacji do budowania przekierowań. Za proxy (Railway)
 * request.nextUrl zawiera adres wewnętrzny serwera, np. https://0.0.0.0:8080.
 * Kolejność: NEXT_PUBLIC_SITE_URL → nagłówki X-Forwarded-* → adres z żądania.
 */
export function publicOrigin(headers: Headers, requestOrigin: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (siteUrl) return siteUrl.replace(/\/$/, "");
  const host = (headers.get("x-forwarded-host") ?? headers.get("host"))?.split(",")[0].trim();
  if (host && !/^(0\.0\.0\.0|\[::\])(:|$)/.test(host)) {
    const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() || new URL(requestOrigin).protocol.replace(":", "");
    return `${proto}://${host}`;
  }
  return requestOrigin;
}
