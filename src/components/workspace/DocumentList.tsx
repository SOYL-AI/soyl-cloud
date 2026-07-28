"use client";

import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * The document list, with ingestion status.
 *
 * Polls while anything is still processing and stops when nothing is. A
 * document takes seconds, so a websocket would be more machinery than the
 * problem deserves — but polling forever on an idle page is rude, hence the
 * stop condition.
 *
 * The poll calls `router.refresh()` rather than holding its own copy of the
 * list. That keeps the server as the single source of truth: copying props
 * into state means two versions that can disagree, and the effect that syncs
 * them is the bug that follows.
 */

export type DocumentRow = {
  id: string;
  title: string;
  status: "uploaded" | "processing" | "ready" | "failed" | "superseded";
  page_count: number | null;
  chunk_count: number;
  stage: string | null;
  error: string | null;
  created_at: string;
};

const POLL_MS = 2000;

/** What each stage is actually doing, in words a hotel manager would use. */
const STAGE_LABEL: Record<string, string> = {
  download: "Fetching the file",
  extract: "Reading the text",
  chunk: "Splitting into sections",
  embed: "Indexing",
  persist: "Saving",
  done: "Finished",
};

export function DocumentList({ initial }: { initial: DocumentRow[] }) {
  const router = useRouter();
  // Only the rows removed in this browser, so a deletion is immediate rather
  // than waiting for a server round trip.
  const [removed, setRemoved] = useState<string[]>([]);

  const documents = initial.filter((document) => !removed.includes(document.id));
  const busy = documents.some(
    (document) => document.status === "uploaded" || document.status === "processing",
  );

  useEffect(() => {
    if (!busy) return;

    const timer = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [busy, router]);

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes the file and everything indexed from it.`)) {
      return;
    }

    setRemoved((current) => [...current, id]);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (documents.length === 0) {
    return (
      <p className="py-8 text-center text-[var(--color-soyl-gray-600)]">
        No documents yet. Upload one above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--color-soyl-gray-200)]">
      {documents.map((document) => (
        <li key={document.id} className="flex items-start gap-4 py-4">
          <span className="mt-0.5 shrink-0">
            <StatusIcon status={document.status} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[var(--color-soyl-charcoal)]">
              {document.title}
            </p>
            <p className="mt-1 text-sm text-[var(--color-soyl-gray-600)]">
              <StatusText document={document} />
            </p>
            {document.error && (
              // The message the pipeline wrote, shown where the person who
              // uploaded it will actually see it.
              <p role="alert" className="mt-2 text-sm text-red-900">
                {document.error}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void remove(document.id, document.title)}
            aria-label={`Delete ${document.title}`}
            className="shrink-0 rounded-lg p-2 text-[var(--color-soyl-gray-400)] transition-colors hover:bg-[var(--color-soyl-gray-100)] hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function StatusIcon({ status }: { status: DocumentRow["status"] }) {
  if (status === "ready") {
    return <CheckCircle2 size={20} className="text-[var(--color-soyl-success)]" />;
  }
  if (status === "failed") {
    return <AlertCircle size={20} className="text-[var(--color-soyl-error)]" />;
  }
  return (
    <Loader2 size={20} className="animate-spin text-[var(--color-soyl-mint-dark)]" />
  );
}

function StatusText({ document }: { document: DocumentRow }) {
  if (document.status === "ready") {
    const pages = document.page_count ? `${document.page_count} pages · ` : "";
    return (
      <>
        {pages}
        {document.chunk_count} sections indexed
      </>
    );
  }

  if (document.status === "failed") {
    // Naming the stage turns "it broke" into "it broke while reading the
    // text", which is the difference between a shrug and an action.
    const stage = document.stage ? STAGE_LABEL[document.stage] ?? document.stage : null;
    return <>Failed{stage ? ` while ${stage.toLowerCase()}` : ""}</>;
  }

  const stage = document.stage ? STAGE_LABEL[document.stage] : null;
  return <>{stage ?? "Waiting to be processed"}…</>;
}

