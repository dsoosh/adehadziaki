"use client";

import { useState, useTransition } from "react";
import { CreditCard, Landmark, Smartphone } from "lucide-react";
import { toUserMessage } from "@/lib/errors";
import { PACKAGES, PAYMENT_METHODS, type PaymentMethod, type PlanPackage } from "@/lib/plans";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChoiceTile } from "@/components/ui/choice-tile";
import { Notice } from "@/components/ui/notice";

const METHOD_ICONS = { blik: Smartphone, card: CreditCard, transfer: Landmark } as const;

/**
 * Wybór pakietu i sposobu płatności. Płatności nie są jeszcze podłączone:
 * zapisujemy wybór (pomiar zainteresowania) i nic nie pobieramy.
 */
export function PlusCheckout() {
  const [pkg, setPkg] = useState<PlanPackage>("yearly");
  const [method, setMethod] = useState<PaymentMethod>("blik");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function checkout() {
    setError(null);
    start(async () => {
      const { error } = await supabaseBrowser().rpc("record_upgrade_intent", { p_package: pkg, p_method: method });
      if (error) setError(toUserMessage(error));
      else setDone(true);
    });
  }

  if (done) {
    return (
      <Notice tone="success" className="animate-view-in">
        <p className="font-bold">Płatności uruchomimy wkrótce.</p>
        <p>Zapisaliśmy, że chcesz plan Plus ({PACKAGES[pkg].label.toLowerCase()}, {PAYMENT_METHODS[method].label}). Damy znać, gdy będzie można zapłacić – nic nie zostało pobrane.</p>
      </Notice>
    );
  }

  return (
    <>
      <section aria-labelledby="plus-package">
        <h2 id="plus-package" className="mb-4 text-2xl font-bold">
          Wybierz pakiet
        </h2>
        <div role="radiogroup" aria-labelledby="plus-package" className="flex flex-col gap-3">
          {(Object.keys(PACKAGES) as PlanPackage[]).map((id) => {
            const p = PACKAGES[id];
            return (
              <ChoiceTile
                key={id}
                label={`${p.label} – ${p.price} ${p.per}`}
                description={p.note}
                selected={pkg === id}
                onSelect={() => setPkg(id)}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="plus-method">
        <h2 id="plus-method" className="mb-4 text-2xl font-bold">
          Sposób płatności
        </h2>
        <div role="radiogroup" aria-labelledby="plus-method" className="flex flex-col gap-3">
          {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((id) => (
            <ChoiceTile
              key={id}
              label={PAYMENT_METHODS[id].label}
              description={PAYMENT_METHODS[id].description}
              icon={METHOD_ICONS[id]}
              selected={method === id}
              onSelect={() => setMethod(id)}
            />
          ))}
        </div>
      </section>

      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex flex-col gap-2">
        <Button block onClick={checkout} disabled={pending}>
          {pending ? "Chwileczkę…" : `Przejdź do płatności – ${PACKAGES[pkg].price} zł`}
        </Button>
        <p className="text-center text-muted">Możesz zrezygnować w każdej chwili.</p>
      </div>
    </>
  );
}
