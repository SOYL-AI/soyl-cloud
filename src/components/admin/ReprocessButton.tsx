"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * Re-run ingestion for one document (`UPDATE.md` §11).
 *
 * The only interactive thing on the documents screen, so it is the only thing
 * on it that ships JavaScript. `router.refresh()` re-runs the server component
 * rather than mutating local state, which means the row shows what the
 * database says rather than what this component hopes happened.
 */
export function ReprocessButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "queued" | "error">("idle");

  async function reprocess() {
    setState("idle");
    const response = await fetch("/api/admin/reprocess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: documentId }),
    });

    if (!response.ok) {
      setState("error");
      return;
    }

    setState("queued");
    startTransition(() => router.refresh());
  }

  return (
    <span className="whitespace-nowrap">
      <button
        type="button"
        onClick={reprocess}
        disabled={pending || state === "queued"}
        className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
      >
        {state === "queued" ? "Queued" : pending ? "…" : "Reprocess"}
      </button>
      {state === "error" ? (
        <span className="ml-2 text-xs text-red-700">failed</span>
      ) : null}
    </span>
  );
}
