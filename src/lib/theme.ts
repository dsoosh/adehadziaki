/** Kopia tokenów z globals.css – używana w testach kontrastu i w manifeście. */
export const THEME = {
  light: {
    bg: "#f7f5f0",
    surface: "#ffffff",
    surface2: "#efece4",
    text: "#1f2933",
    muted: "#52606d",
    accent: "#2f5fd0",
    accentText: "#ffffff",
    accentSoft: "#e3eafb",
    success: "#2e7d5b",
    successSoft: "#e2f1e9",
    warning: "#9a4a00",
    warningSoft: "#fbeedd",
    danger: "#b42318",
    dangerSoft: "#fbe4e2",
  },
  dark: {
    bg: "#14181d",
    surface: "#1e242b",
    surface2: "#262d35",
    text: "#e6e8eb",
    muted: "#a7b0ba",
    accent: "#8fb0ff",
    accentText: "#0e1726",
    accentSoft: "#24304a",
    success: "#7bd3a8",
    successSoft: "#1d3329",
    warning: "#f5b971",
    warningSoft: "#3a2c1a",
    danger: "#f59a93",
    dangerSoft: "#3d2220",
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
