import Link from "next/link";

export function TermsCheckbox({ error }: { error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-12 items-start gap-3">
        <input
          type="checkbox"
          name="terms"
          className="mt-1 size-6 shrink-0 accent-[var(--accent)]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "terms-error" : undefined}
        />
        <span>
          Akceptuję{" "}
          <Link href="/regulamin" className="font-bold text-accent" target="_blank">
            regulamin
          </Link>{" "}
          i{" "}
          <Link href="/prywatnosc" className="font-bold text-accent" target="_blank">
            politykę prywatności
          </Link>
          .
        </span>
      </label>
      {error && (
        <p id="terms-error" className="text-base font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
