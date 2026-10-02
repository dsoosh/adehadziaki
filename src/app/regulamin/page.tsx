import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Regulamin" };

export default function TermsPage() {
  return (
    <LegalPage title="Regulamin">
      <h2>1. Czym jest Adehadziaki</h2>
      <p>
        Adehadziaki to bezpłatna usługa testowa, która łączy dwie dorosłe osoby na wspólną sesję wideo lub audio,
        podczas której każda z nich zajmuje się własnym zadaniem.
      </p>
      <h2>2. Kto może korzystać</h2>
      <ul>
        <li>Osoby, które ukończyły 18 lat.</li>
        <li>Jedna osoba – jedno konto.</li>
      </ul>
      <h2>3. Zasady zachowania</h2>
      <ul>
        <li>Szanuj drugą osobę. Zakazane są treści seksualne, obraźliwe, nękanie i reklama.</li>
        <li>Nie nagrywaj rozmów i nie rób zrzutów ekranu z wizerunkiem partnera bez zgody.</li>
        <li>Możesz w każdej chwili zakończyć sesję, zablokować lub zgłosić partnera.</li>
      </ul>
      <h2>4. Odpowiedzialność</h2>
      <p>
        Usługa jest w fazie testów i może działać z przerwami. Nie jest formą terapii ani pomocy medycznej. Konta
        naruszające zasady możemy zablokować.
      </p>
      <h2>5. Usunięcie konta</h2>
      <p>Konto możesz usunąć w każdej chwili w profilu.</p>
    </LegalPage>
  );
}
