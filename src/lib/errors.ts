/** Zamienia kody błędów z bazy i sieci na krótkie polskie komunikaty z następnym krokiem. */
const MESSAGES: Record<string, string> = {
  booking_conflict: "O tej porze masz już sesję. Wybierz inną godzinę.",
  slot_out_of_range: "Tej godziny nie da się już zarezerwować. Wybierz późniejszą.",
  invalid_slot: "Ta godzina jest niedostępna. Wybierz inną.",
  booking_not_found: "Nie znaleźliśmy tej rezerwacji. Odśwież stronę.",
  booking_started: "Sesja już się zaczęła – nie można jej anulować.",
  not_authenticated: "Zaloguj się ponownie, aby kontynuować.",
  session_not_found: "To nie jest Twoja sesja.",
};

export const NETWORK_ERROR = "Nie udało się połączyć. Sprawdź internet i spróbuj ponownie.";
export const SERVER_ERROR = "Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę.";

type ErrorLike = { message?: string; code?: string } | null | undefined;

export function toUserMessage(error: ErrorLike): string {
  if (!error?.message) return NETWORK_ERROR;
  for (const [code, msg] of Object.entries(MESSAGES)) {
    if (error.message.includes(code)) return msg;
  }
  // Odpowiedź z kodem (PostgREST / Postgres) = serwer odpowiedział, więc to nie wina internetu.
  if (error.code) {
    console.error("Błąd serwera:", error.code, error.message);
    return SERVER_ERROR;
  }
  return NETWORK_ERROR;
}
