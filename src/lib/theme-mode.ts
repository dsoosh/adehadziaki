/** Motyw jasny/ciemny: domyślnie jasny, wybór zapamiętany w localStorage. */
export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "adh:theme";
export const THEME_COLORS: Record<ThemeMode, string> = { light: "#f3f0e8", dark: "#1b201d" };

/**
 * Skrypt wstawiany do <head>: ustawia motyw przed pierwszym odmalowaniem strony,
 * żeby nie było mignięcia jasnego tła przy wybranym trybie ciemnym.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?${JSON.stringify(
  THEME_COLORS.dark,
)}:${JSON.stringify(THEME_COLORS.light)})}}catch(e){}})()`;
