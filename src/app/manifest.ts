import type { MetadataRoute } from "next";
import { THEME } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Adehadziaki – zrób to razem",
    short_name: "Adehadziaki",
    description: "Body doubling po polsku: wspólne sesje pracy, sprzątania czy spaceru przez wideo lub audio.",
    lang: "pl",
    start_url: "/start",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: THEME.light.bg,
    theme_color: THEME.light.bg,
    categories: ["productivity", "health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
