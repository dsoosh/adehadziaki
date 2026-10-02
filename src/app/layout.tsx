import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { NavProgress } from "@/components/nav-progress";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme-mode";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Adehadziaki – zrób to razem",
    template: "%s · Adehadziaki",
  },
  description:
    "Body doubling po polsku. Wybierz, co chcesz zrobić i jak długo – połączymy Cię z kimś, kto w tym czasie też działa.",
  applicationName: "Adehadziaki",
  appleWebApp: { capable: true, title: "Adehadziaki", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: THEME_COLORS.light,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Domyślnie jasny; skrypt w <head> przywraca zapamiętany wybór przed odmalowaniem.
    <html lang="pl" data-theme="light" suppressHydrationWarning className={`${atkinson.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <NavProgress />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
