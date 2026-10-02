export function validateDisplayName(raw: string): string | null {
  const name = raw.trim();
  if (name.length < 2 || name.length > 30) return "Nazwa musi mieć od 2 do 30 znaków.";
  return null;
}

export function validateEmail(raw: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim()) ? null : "Wpisz poprawny adres e-mail.";
}

export function validatePassword(raw: string): string | null {
  return raw.length >= 8 ? null : "Hasło musi mieć co najmniej 8 znaków.";
}
