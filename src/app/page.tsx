import Link from "next/link";
import { Footprints, Handshake, Timer } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Page } from "@/components/ui/page";

const STEPS = [
  { icon: Footprints, title: "Wybierz, co robisz", text: "Praca, nauka, sprzątanie, spacer, ogród – cokolwiek odkładasz." },
  { icon: Timer, title: "Ustaw czas", text: "25, 50 albo 75 minut. Krótko i konkretnie." },
  { icon: Handshake, title: "Działajcie razem", text: "Łączymy Cię z kimś przez wideo lub sam głos. Każde robi swoje." },
];

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  return (
    <Page className="gap-10">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold text-accent">Adehadziaki</span>
        <Link href="/logowanie" className="flex min-h-12 items-center font-bold">
          Zaloguj się
        </Link>
      </header>

      {sp.konto === "usuniete" && <Notice tone="success">Twoje konto zostało usunięte.</Notice>}

      <section className="flex flex-col gap-4">
        <h1 className="text-4xl leading-tight font-bold sm:text-5xl">Trudno zacząć? Zrób to z kimś.</h1>
        <p className="text-xl text-muted">
          Body doubling po polsku. Gdy ktoś działa obok Ciebie, łatwiej zacząć i skończyć – nawet jeśli robicie
          zupełnie co innego.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/rejestracja">Załóż konto</ButtonLink>
          <ButtonLink href="/logowanie" variant="secondary">
            Mam już konto
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="jak">
        <h2 id="jak" className="mb-4 text-2xl font-bold">
          Jak to działa
        </h2>
        <ol className="flex flex-col gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-2xl border-2 border-border bg-surface p-5">
              <s.icon aria-hidden className="size-8 shrink-0 text-accent" strokeWidth={1.75} />
              <div>
                <p className="font-bold">
                  {i + 1}. {s.title}
                </p>
                <p className="text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="dla-kogo" className="flex flex-col gap-2">
        <h2 id="dla-kogo" className="text-2xl font-bold">
          Dla kogo?
        </h2>
        <p>
          Dla każdego, komu trudno się zebrać – szczególnie dla osób z ADHD. Bez rankingów, bez presji, bez
          nagrywania. Tylko Ty, druga osoba i licznik czasu.
        </p>
      </section>

      <footer className="mt-auto flex flex-wrap gap-4 border-t-2 border-border pt-6 text-muted">
        <Link href="/regulamin" className="min-h-12">
          Regulamin
        </Link>
        <Link href="/prywatnosc" className="min-h-12">
          Polityka prywatności
        </Link>
      </footer>
    </Page>
  );
}
