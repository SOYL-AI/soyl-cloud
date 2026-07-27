"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthShell, Field, FormError, FormNotice } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

/**
 * Sign in.
 *
 * `signIn(..., { redirect: false })` rather than letting NextAuth navigate, so
 * a failure re-renders this page with a message instead of bouncing through
 * `/api/auth/error` and losing what the visitor typed.
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set by /signup and by the reset-password confirmation, so arriving here
  // after either one explains itself.
  const notice = params.get("notice");
  const next = params.get("next") ?? "/app";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (result?.ok) {
      // replace, not push: the login page should not be in the back stack
      // once you are past it.
      router.replace(next);
      return;
    }

    // One message for every cause, matching the API. Which of "no such
    // account", "wrong password" and "suspended" it was must not be
    // distinguishable here either.
    setError("That email and password combination is not right.");
    setSubmitting(false);
  }

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back."
      footer={
        <>
          No account yet?{" "}
          <Link href="/signup" className="font-semibold underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {notice === "check-email" && (
          <FormNotice>
            Check your email for a link to confirm your address. You can sign in
            once it is confirmed.
          </FormNotice>
        )}
        {notice === "password-reset" && (
          <FormNotice>
            Your password has been changed and you have been signed out
            everywhere else. Sign in with the new one.
          </FormNotice>
        )}
        {notice === "verified" && (
          <FormNotice>Your email address is confirmed. Sign in to continue.</FormNotice>
        )}

        {error && <FormError>{error}</FormError>}

        <Field id="email" label="Work email" type="email" autoComplete="email" />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Sign in
        </Button>

        <Link
          href="/forgot-password"
          className="text-center text-sm text-[var(--color-soyl-gray-600)] underline hover:text-[var(--color-soyl-charcoal)]"
        >
          Forgot your password?
        </Link>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary to prerender.
  return (
    <Suspense fallback={<AuthShell title="Sign in">{null}</AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
