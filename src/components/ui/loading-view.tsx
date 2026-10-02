/**
 * Spokojny wskaźnik ładowania kolejnego widoku. Pojawia się z opóźnieniem,
 * żeby przy szybkich przejściach nic nie migało.
 */
export function LoadingView({ label = "Ładuję…" }: { label?: string }) {
  return (
    <main
      className="mx-auto flex w-full max-w-xl flex-1 animate-loader-in flex-col items-center justify-center gap-4 px-4 py-16"
      role="status"
      aria-live="polite"
    >
      <span className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-3 animate-dot rounded-full bg-accent"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      <span className="text-muted">{label}</span>
    </main>
  );
}
