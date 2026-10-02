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

export function toUserMessage(error: { message?: string } | null | undefined): string {
  if (!error?.message) return NETWORK_ERROR;
  for (const [code, msg] of Object.entries(MESSAGES)) {
    if (error.message.includes(code)) return msg;
  }
  return NETWORK_ERROR;
}
