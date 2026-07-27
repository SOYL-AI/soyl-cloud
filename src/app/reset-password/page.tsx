"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-constants";

/**
 * Set a new password from a reset link.
 *
 * The token arrives in the query string, which is how a link works, and is
 * never rendered into the page or logged. It is read once and posted.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    // Checked here and not on the server: the server has no opinion about a
    // field the API never sees. It exists to stop a typo becoming a lockout.
    if (password !== confirm) {
      setError("Those two passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/password-reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        router.replace("/login?notice=password-reset");
        return;
      }

      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "We could not reset your password.");
    } catch {
      setError("We could not reach our server. Check your connection and try again.");
    }

    setSubmitting(false);
  }

  if (!token) {
    return (
      <AuthShell title="Reset your password">
        <FormError>
          This link is missing its token. Ask for a new one from the{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            reset page
          </Link>
          .
        </FormError>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="You will be signed out everywhere else."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error && <FormError>{error}</FormError>}

        <Field
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <Field
          id="confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Set new password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Reset your password">{null}</AuthShell>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
