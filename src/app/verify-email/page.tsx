"use client";

import { track } from "@/lib/analytics";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { AuthShell, FormError, FormNotice } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

/**
 * Redeem an email-verification link.
 *
 * The token is consumed on arrival rather than behind a button. A confirmation
 * link that needs a second click is a link a meaningful share of people never
 * finish, and the token is single-use server-side regardless.
 *
 * The `useRef` guard matters: React 19 in development mounts effects twice,
 * and without it the second run redeems an already-consumed token and shows a
 * failure for a verification that actually worked.
 */
function VerifyEmail() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<"working" | "done" | "failed">("working");
  const [message, setMessage] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    // A missing token is knowable during render, so it is handled below rather
    // than by setting state from an effect.
    if (!token) return;

    if (attempted.current) return;
    attempted.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setState("done");
          // Give the confirmation a moment to be read rather than flashing it.
          track("Email Verified");
          setTimeout(() => router.replace("/login?notice=verified"), 1500);
          return;
        }

        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setState("failed");
        setMessage(body?.message ?? "That link is invalid or has expired.");
      } catch {
        setState("failed");
        setMessage("We could not reach our server. Check your connection and try again.");
      }
    })();
  }, [token, router]);

  if (!token) {
    return (
      <AuthShell title="Confirming your email">
        <div className="flex flex-col gap-6">
          <FormError>This link is missing its token.</FormError>
          <Button href="/login" size="lg" className="w-full">
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Confirming your email">
      {state === "working" && (
        <p className="text-[var(--color-soyl-gray-600)]">One moment…</p>
      )}

      {state === "done" && (
        <FormNotice>
          Your email address is confirmed. Taking you to sign in…
        </FormNotice>
      )}

      {state === "failed" && (
        <div className="flex flex-col gap-6">
          <FormError>{message}</FormError>
          <p className="text-sm text-[var(--color-soyl-gray-600)]">
            Verification links expire after 24 hours and work once. Sign in and
            we will send a new one.
          </p>
          <Button href="/login" size="lg" className="w-full">
            Go to sign in
          </Button>
        </div>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthShell title="Confirming your email">{null}</AuthShell>}>
      <VerifyEmail />
    </Suspense>
  );
}
