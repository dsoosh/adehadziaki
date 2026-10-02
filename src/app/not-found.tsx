import { ButtonLink } from "@/components/ui/button";
import { Page } from "@/components/ui/page";

export default function NotFound() {
  return (
    <Page className="gap-6">
      <h1 className="text-3xl font-bold">Nie ma takiej strony</h1>
      <p className="text-muted">Możliwe, że link jest nieaktualny.</p>
      <ButtonLink href="/" block>
        Wróć na stronę główną
      </ButtonLink>
    </Page>
  );
}
