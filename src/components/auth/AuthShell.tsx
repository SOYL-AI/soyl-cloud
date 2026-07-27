import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";

/**
 * The frame every auth page sits in.
 *
 * One component rather than four near-identical layouts, because these pages
 * are the first thing a hotel owner sees after deciding to try the product and
 * they should not drift apart visually as they get edited separately.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-[var(--color-soyl-gray-50)] py-16">
      <Container size="sm">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-8 shadow-sm md:p-10">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-[var(--color-soyl-gray-600)]">{description}</p>
            )}
            <div className="mt-8">{children}</div>
          </div>

          {footer && (
            <p className="mt-6 text-center text-sm text-[var(--color-soyl-gray-600)]">{footer}</p>
          )}

          <p className="mt-8 text-center text-xs text-[var(--color-soyl-gray-500)]">
            <Link href="/privacy" className="underline hover:text-[var(--color-soyl-charcoal)]">
              Privacy
            </Link>
            {" · "}
            <Link href="/terms" className="underline hover:text-[var(--color-soyl-charcoal)]">
              Terms
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}

/** A single labelled input. Every auth field is one of these. */
export function Field({
  id,
  label,
  type = "text",
  autoComplete,
  required = true,
  minLength,
  placeholder,
  hint,
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        // aria-describedby only when there is a hint, so screen readers are not
        // pointed at an element that does not exist.
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-12 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] px-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)]"
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-soyl-gray-500)]">
          {hint}
        </p>
      )}
    </div>
  );
}

/** An error the visitor needs to read. `role="alert"` so it is announced. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      {children}
    </div>
  );
}

/** Confirmation. `role="status"` rather than `alert` — it is not a problem. */
export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-mint-light)] p-4 text-sm text-[var(--color-soyl-charcoal)]"
    >
      {children}
    </div>
  );
}
