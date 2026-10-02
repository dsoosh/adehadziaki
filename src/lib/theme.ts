/** Kopia tokenów z globals.css – używana w testach kontrastu i w manifeście. */
export const THEME = {
  light: {
    bg: "#f3f0e8",
    surface: "#faf8f3",
    surface2: "#e9e5da",
    text: "#2f3a34",
    muted: "#59625b",
    accent: "#4a6b57",
    accentText: "#faf8f3",
    accentSoft: "#e0e8df",
    success: "#3d6649",
    successSoft: "#e1ece2",
    warning: "#85582a",
    warningSoft: "#f2e6d5",
    danger: "#9a4636",
    dangerSoft: "#f4e2dc",
  },
  dark: {
    bg: "#1b201d",
    surface: "#232925",
    surface2: "#2b322d",
    text: "#e3e6e0",
    muted: "#a8b0a8",
    accent: "#9dbfa8",
    accentText: "#17201a",
    accentSoft: "#2c3a31",
    success: "#a6ccb0",
    successSoft: "#24332a",
    warning: "#d9b48c",
    warningSoft: "#3a3026",
    danger: "#e3a596",
    dangerSoft: "#3d2a26",
  },
} as const;

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
