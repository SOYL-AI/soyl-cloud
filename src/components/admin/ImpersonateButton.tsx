"use client";

import { useState } from "react";

/**
 * Start an impersonation (`UPDATE.md` §11: audited, time-boxed, banner shown).
 *
 * Confirms first, and the confirmation says what is about to be recorded
 * rather than asking "are you sure?". Someone who is about to look at a
 * customer's data should be told that this will be written down with their
 * name on it — that is the point of the audit, and a dialog that hides it
 * makes the audit a trap rather than a control.
 *
 * On success it navigates with a full page load rather than `router.push`,
 * because the impersonation cookie was just set by the response and every
 * cached RSC payload in the client router was rendered without it.
 */
export function ImpersonateButton({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    const agreed = window.confirm(
      `Open ${tenantName}'s workspace as one of their users?\n\n` +
        "This is recorded in the audit log with your name, lasts 30 minutes, and is read-only. " +
        "A banner will show on every page until you stop.",
    );
    if (!agreed) return;

    setPending(true);
    setError(null);

    const response = await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Could not start.");
      setPending(false);
      return;
    }

    window.location.href = "/app";
  }

  return (
    <span className="flex items-center gap-2">
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Starting…" : "Impersonate"}
      </button>
    </span>
  );
}
