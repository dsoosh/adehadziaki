import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Polityka prywatności" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Polityka prywatności">
      <h2>Jakie dane zbieramy</h2>
      <ul>
        <li>Adres e-mail i hasło (zaszyfrowane) – do logowania.</li>
        <li>Nazwę wyświetlaną – pokazujemy ją partnerowi w sesji.</li>
        <li>Historię sesji: czynność, czas, cel, Twoją ocenę sesji.</li>
        <li>Zgłoszenia i blokady – dla bezpieczeństwa użytkowników.</li>
        <li>Dane subskrypcji powiadomień, jeśli je włączysz.</li>
      </ul>
      <h2>Czego nie robimy</h2>
      <ul>
        <li>Nie nagrywamy rozmów. Obraz i dźwięk płyną na żywo między Tobą a partnerem.</li>
        <li>Nie pokazujemy partnerowi Twojego adresu e-mail.</li>
        <li>Nie sprzedajemy danych i nie wyświetlamy reklam.</li>
      </ul>
      <h2>Gdzie są dane</h2>
      <p>
        Dane przechowujemy w Unii Europejskiej u dostawców: Supabase (baza danych i logowanie), Daily.co (połączenia
        wideo i audio), Railway (serwer aplikacji).
      </p>
      <h2>Twoje prawa</h2>
      <p>
        Masz prawo do dostępu do danych, ich poprawienia i usunięcia. Konto wraz z danymi usuniesz samodzielnie w
        profilu. Zgłoszenia złożone na inne osoby mogą być przechowywane w formie zanonimizowanej.
      </p>
    </LegalPage>
  );
}
