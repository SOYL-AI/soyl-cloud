/**
 * Loading placeholders.
 *
 * Both workspace pages call the API before they can render, so without these
 * a navigation shows nothing at all until the round trip finishes. A skeleton
 * that matches the shape of what is coming makes the wait feel like loading
 * rather than like a broken link — and because it matches, the content does
 * not jump when it arrives.
 *
 * Deliberately not a spinner: a spinner says "wait", a skeleton says "here is
 * what you are about to get".
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-[var(--color-soyl-gray-100)] ${className}`}
    />
  );
}

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    // The whole block is one status region, so a screen reader is told the
    // page is loading once rather than reading a dozen empty boxes.
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10 lg:py-12" role="status">
      <span className="sr-only">Loading…</span>

      <Skeleton className="mb-4 h-6 w-28 rounded-full" />
      <Skeleton className="mb-3 h-10 w-72" />
      <Skeleton className="mb-10 h-5 w-full max-w-xl" />

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-24 rounded-[20px]" />
        ))}
      </div>

      <Skeleton className="mb-5 h-4 w-32" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-44 rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}
