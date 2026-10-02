"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { savePushSubscription } from "@/app/push-actions";
import { pushSupported, subscribePush } from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Prośba o powiadomienia – pokazywana dopiero po świadomej akcji (np. rezerwacji). */
export function PushPrompt() {
  const [state, setState] = useState<"idle" | "pending" | "done" | "denied">("idle");
  if (!pushSupported() || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;

  if (state === "done") return <p className="font-bold text-success">Przypomnimy Ci 10 minut i minutę przed startem.</p>;
  if (state === "denied")
    return <p className="text-muted">Bez zgody na powiadomienia nie możemy przypominać. Możesz to zmienić w profilu.</p>;

  return (
    <Card className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-bold">
        <Bell aria-hidden className="size-5 text-accent" /> Przypomnieć Ci przed startem?
      </p>
      <Button
        variant="secondary"
        disabled={state === "pending"}
        onClick={async () => {
          setState("pending");
          const sub = await subscribePush();
          if (!sub) return setState("denied");
          const res = await savePushSubscription(sub);
          setState(res.ok ? "done" : "denied");
        }}
      >
        Przypominaj mi
      </Button>
    </Card>
  );
}
