"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthShell, Field, FormError, FormNotice } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

/**
 * Ask for a reset link.
 *
 * Shows the same confirmation whatever happened, because this page is
 * unauthenticated, takes an email address, and is linked from the login page —
 * any difference in what it says is a public account-existence check.
 */
export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") ?? "") }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("We could not reach our server. Check your connection and try again.");
    }

    setSubmitting(false);
  }

  return (
    <AuthShell
      title="Reset your password"
      description={sent ? undefined : "We will email you a link."}
      footer={
        <Link href="/login" className="font-semibold underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <FormNotice>
          If that address has an account, a reset link is on its way. It works
          once and expires in an hour.
        </FormNotice>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {error && <FormError>{error}</FormError>}
          <Field id="email" label="Work email" type="email" autoComplete="email" />
          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
