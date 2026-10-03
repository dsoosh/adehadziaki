import type { Metadata } from "next";
import { Check, Feather, Minus } from "lucide-react";
import { PlusCheckout } from "@/components/plus/plus-checkout";
import { Card } from "@/components/ui/card";
import { Page } from "@/components/ui/page";
import { COMPARISON, isPlus } from "@/lib/plans";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Plan Plus" };

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "string") return <>{value}</>;
  return value ? (
    <>
      <Check aria-hidden className="mx-auto size-6 text-success" strokeWidth={2.5} />
      <span className="sr-only">tak</span>
    </>
  ) : (
    <>
      <Minus aria-hidden className="mx-auto size-6 text-muted" />
      <span className="sr-only">nie</span>
    </>
  );
}

export default async function PlusPage() {
  const { profile } = await requireUser("/plus");
  const plusUntil = profile.plus_until;
  const active = isPlus(plusUntil);

  return (
    <Page className="gap-8">
      <section>
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
          <Feather aria-hidden className="size-7 text-accent" />
          Plan Plus
        </h1>
        <p className="text-lg text-muted">Więcej sesji, mniej liczenia. Siadasz do pracy, kiedy potrzebujesz.</p>
      </section>

      <div className="overflow-hidden rounded-2xl border-2 border-border bg-surface">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Porównanie planu darmowego i Plus</caption>
          <thead>
            <tr className="border-b-2 border-border">
              <th scope="col" className="px-3 py-3">
                <span className="sr-only">Cecha</span>
              </th>
              <th scope="col" className="px-3 py-3 text-center">
                Darmowy
              </th>
              <th scope="col" className="bg-accent-soft px-3 py-3 text-center">
                Plus
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map(([feature, free, plus]) => (
              <tr key={feature} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-3 py-3 font-normal">
                  {feature}
                </th>
                <td className="px-3 py-3 text-center text-muted">
                  <Cell value={free} />
                </td>
                <td className="bg-accent-soft px-3 py-3 text-center font-bold">
                  <Cell value={plus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active ? (
        <Card className="flex flex-col gap-1">
          <p className="text-xl font-bold">Masz plan Plus</p>
          <p className="text-muted">
            Ważny do {new Date(plusUntil!).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}.
            Dziękujemy, że wspierasz Adehadziaki!
          </p>
        </Card>
      ) : (
        <PlusCheckout />
      )}
    </Page>
  );
}
