"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-constants";

/**
 * Create an account.
 *
 * Posts to our own route handler rather than to the API directly: the API's
 * base URL and nothing else about it should be visible from the browser, and
 * the handler is where a rate limit belongs.
 */
export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          display_name: String(form.get("display_name") ?? "") || null,
        }),
      });

      if (response.ok) {
        // Always here, whether or not the address was already registered.
        // The API answers identically by design and this must not undo it.
        router.replace("/login?notice=check-email");
        return;
      }

      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "We could not create that account. Please try again.");
    } catch {
      setError("We could not reach our server. Check your connection and try again.");
    }

    setSubmitting(false);
  }

  return (
    <AuthShell
      title="Create your account"
      description="Free while we are in pilot."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {error && <FormError>{error}</FormError>}

        <Field
          id="display_name"
          label="Your name"
          autoComplete="name"
          required={false}
          placeholder="Priya Raman"
        />
        <Field
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="priya@grandresort.com"
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters. A short phrase you will remember beats a short jumble you will not.`}
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Create account
        </Button>

        <p className="text-xs text-[var(--color-soyl-gray-500)]">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
