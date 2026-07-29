"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Drag-and-drop upload.
 *
 * Three requests per file, because that is the shape the API exposes and the
 * shape exists for a reason: the bytes go **straight from this browser to
 * object storage**, never through Vercel. A 40 MB PDF would otherwise hit the
 * 4.5 MB body limit and occupy a function for the whole transfer.
 *
 *   1. POST /api/documents          → reserve, get a presigned URL
 *   2. PUT  <presigned url>         → the bytes, direct
 *   3. POST /api/documents/:id/ingest → confirm, which queues the work
 *
 * Progress is real, from XHR's upload events, because a fake progress bar on a
 * 40 MB upload over a hotel's connection is a lie people notice.
 */

type Upload = {
  id: string;
  filename: string;
  progress: number;
  state: "uploading" | "processing" | "failed";
  error?: string;
};

const ACCEPTED = ".pdf,.txt,.md";
const ACCEPTED_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
};

/** The browser's own guess is unreliable for .md, so derive it from the name. */
function contentTypeFor(filename: string, fallback: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return ACCEPTED_TYPES[extension] ?? fallback ?? "application/octet-stream";
}

export function DocumentUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);

  const update = useCallback((id: string, patch: Partial<Upload>) => {
    setUploads((current) =>
      current.map((upload) => (upload.id === id ? { ...upload, ...patch } : upload)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setUploads((current) => current.filter((upload) => upload.id !== id));
  }, []);

  const send = useCallback(
    async (file: File) => {
      const localId = crypto.randomUUID();
      setUploads((current) => [
        ...current,
        { id: localId, filename: file.name, progress: 0, state: "uploading" },
      ]);

      try {
        // 1. Reserve.
        const reserved = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            content_type: contentTypeFor(file.name, file.type),
          }),
        });

        if (!reserved.ok) {
          const body = (await reserved.json().catch(() => null)) as { message?: string } | null;
          update(localId, {
            state: "failed",
            error: body?.message ?? "We could not start that upload.",
          });
          return;
        }

        const { document_id, upload_url, required_headers } = (await reserved.json()) as {
          document_id: string;
          upload_url: string;
          required_headers: Record<string, string>;
        };

        // 2. The bytes, direct to storage. XHR rather than fetch because fetch
        //    still has no upload progress event.
        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("PUT", upload_url);
          for (const [header, value] of Object.entries(required_headers)) {
            request.setRequestHeader(header, value);
          }
          request.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              update(localId, { progress: Math.round((event.loaded / event.total) * 100) });
            }
          });
          request.addEventListener("load", () =>
            request.status < 300 ? resolve() : reject(new Error(`upload failed: ${request.status}`)),
          );
          request.addEventListener("error", () => reject(new Error("upload failed")));
          request.send(file);
        });

        // 3. Confirm, which queues ingestion.
        update(localId, { progress: 100, state: "processing" });
        const confirmed = await fetch(`/api/documents/${document_id}/ingest`, { method: "POST" });
        if (confirmed.ok) track("Document Uploaded");

        if (!confirmed.ok) {
          const body = (await confirmed.json().catch(() => null)) as { message?: string } | null;
          update(localId, {
            state: "failed",
            error: body?.message ?? "We could not start processing that document.",
          });
          return;
        }

        // The document now exists server-side with its own status, so this
        // local row has done its job — the list takes over from here.
        remove(localId);
        router.refresh();
      } catch {
        update(localId, {
          state: "failed",
          error: "The upload did not finish. Check your connection and try again.",
        });
      }
    },
    [remove, router, update],
  );

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    for (const file of Array.from(event.dataTransfer.files)) void send(file);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          "rounded-[28px] border-2 border-dashed p-10 text-center transition-colors",
          dragging
            ? "border-[var(--color-soyl-mint-dark)] bg-[var(--color-soyl-mint-light)]"
            : "border-[var(--color-soyl-gray-200)] bg-white",
        ].join(" ")}
      >
        <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)]">
          <UploadCloud size={26} />
        </span>

        <h3 className="text-lg font-bold text-[var(--color-soyl-charcoal)]">
          Drop your documents here
        </h3>
        <p className="mx-auto mt-2 max-w-md text-[var(--color-soyl-gray-600)]">
          SOPs, policies, contracts, rate sheets. PDF, plain text or Markdown,
          up to 50 MB each.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 rounded-md bg-[var(--color-soyl-charcoal)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          Choose files
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="sr-only"
          onChange={(event) => {
            for (const file of Array.from(event.target.files ?? [])) void send(file);
            // Reset so the same file can be picked twice in a row.
            event.target.value = "";
          }}
        />
      </div>

      <AnimatePresence>
        {uploads.map((upload) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-[var(--color-soyl-gray-200)] bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="shrink-0 text-[var(--color-soyl-gray-400)]" />
              <span className="flex-1 truncate text-sm font-semibold text-[var(--color-soyl-charcoal)]">
                {upload.filename}
              </span>
              <span className="text-xs text-[var(--color-soyl-gray-500)]">
                {upload.state === "uploading" && `${upload.progress}%`}
                {upload.state === "processing" && "Starting…"}
              </span>
              {upload.state === "failed" && (
                <button
                  type="button"
                  onClick={() => remove(upload.id)}
                  aria-label={`Dismiss ${upload.filename}`}
                  className="rounded p-1 text-[var(--color-soyl-gray-400)] hover:text-[var(--color-soyl-charcoal)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {upload.state !== "failed" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-soyl-gray-100)]">
                <div
                  className="h-full rounded-full bg-[var(--color-soyl-mint-dark)] transition-[width] duration-200"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}

            {upload.error && (
              <p role="alert" className="mt-3 text-sm text-red-900">
                {upload.error}
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
