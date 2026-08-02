"use client";

import { useState } from "react";

import type { Impersonation } from "@/lib/session";

/**
 * The banner `UPDATE.md` §11 requires.
 *
 * Deliberately loud, deliberately fixed, and deliberately not dismissible. The
 * failure it prevents is not confusion — it is a staff member forgetting whose
 * data is on screen and acting on it as if it were their own. A banner you can
 * close is a banner that stops working after the second time you see it.
 *
 * It states three things because all three are load-bearing: whose workspace
 * this is, that the session is read-only, and when it ends.
 */
export function ImpersonationBanner({ impersonation }: { impersonation: Impersonation }) {
  const [leaving, setLeaving] = useState(false);

  async function stop() {
    setLeaving(true);
    await fetch("/api/admin/impersonate", { method: "DELETE" });
    // A full load, not `router.refresh()`: the cookie has changed and every
    // cached RSC payload the client router holds was rendered with it set.
    window.location.href = "/admin";
  }

  const ends = new Date(impersonation.expiresAt);

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-sm text-amber-950"
    >
      <strong className="font-semibold">Viewing {impersonation.tenantName}</strong>
      <span>
        as {impersonation.actingAs} · read-only · ends{" "}
        {ends.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <button
        type="button"
        onClick={stop}
        disabled={leaving}
        className="ml-auto rounded bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-50 hover:bg-black disabled:opacity-60"
      >
        {leaving ? "Stopping…" : "Stop impersonating"}
      </button>
    </div>
  );
}
