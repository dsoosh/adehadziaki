"use client";

import { useState } from "react";
import { disablePush, savePushSubscription } from "@/app/push-actions";
import { pushSupported, subscribePush, unsubscribePush } from "@/lib/push-client";
import { useClientValue } from "@/lib/use-client-value";
import { Button } from "@/components/ui/button";

export function PushSettings({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const supported = useClientValue<boolean | null>(
    () => pushSupported() && Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    null,
  );
  const isIos = useClientValue(() => /iphone|ipad|ipod/i.test(navigator.userAgent), false);
  const standalone = useClientValue(() => window.matchMedia("(display-mode: standalone)").matches, false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {isIos && !standalone && (
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className="font-bold">Zainstaluj aplikację na iPhonie</p>
          <p>
            W Safari dotknij <strong>Udostępnij</strong>, a potem <strong>Do ekranu początkowego</strong>. Dopiero
            wtedy iPhone pozwoli na przypomnienia.
          </p>
        </div>
      )}
      {supported === false ? (
        <p className="text-muted">Ta przeglądarka nie obsługuje powiadomień.</p>
      ) : supported ? (
        <div className="flex flex-col gap-2">
          <p>
            Przypomnienia przed sesją: <strong>{on ? "włączone" : "wyłączone"}</strong>
          </p>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setMsg(null);
              if (on) {
                const endpoint = await unsubscribePush();
                await disablePush(endpoint);
                setOn(false);
              } else {
                const sub = await subscribePush();
                const res = sub ? await savePushSubscription(sub) : { ok: false };
                if (res.ok) setOn(true);
                else setMsg("Nie udało się włączyć. Sprawdź, czy przeglądarka pozwala na powiadomienia.");
              }
              setPending(false);
            }}
          >
            {on ? "Wyłącz przypomnienia" : "Włącz przypomnienia"}
          </Button>
          {msg && <p className="text-warning">{msg}</p>}
        </div>
      ) : null}
    </div>
  );
}
