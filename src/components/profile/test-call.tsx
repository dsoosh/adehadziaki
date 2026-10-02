import { Headphones, Video } from "lucide-react";
import { startTestSession } from "@/app/(app)/profil/test-actions";
import { Button } from "@/components/ui/button";

/** Tylko dla administratorów: sesja testowa bez drugiej osoby. */
export function TestCall() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted">
        Otwiera pokój, w którym jesteś po obu stronach. Wejdź w ten sam link na drugim urządzeniu (albo w drugiej karcie),
        żeby sprawdzić kamerę, dźwięk i połączenie.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <form action={startTestSession}>
          <input type="hidden" name="mode" value="video" />
          <Button type="submit" variant="secondary" block>
            <Video aria-hidden /> Test z kamerą
          </Button>
        </form>
        <form action={startTestSession}>
          <input type="hidden" name="mode" value="audio" />
          <Button type="submit" variant="secondary" block>
            <Headphones aria-hidden /> Test głosowy
          </Button>
        </form>
      </div>
    </div>
  );
}
