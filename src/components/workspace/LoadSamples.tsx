"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Load a sample corpus into an empty workspace.
 *
 * An empty knowledge base is an empty product: someone who has just signed up
 * has nothing to ask about, and asking them to first write and upload a set of
 * hotel SOPs is a twenty-minute detour before they see anything work. This
 * makes the first useful answer about ten seconds away.
 *
 * It goes through the ordinary upload path — reserve, PUT to storage, confirm —
 * rather than a seeding endpoint. A shortcut would exercise a pipeline we do
 * not ship, and the first thing anyone would want to know after a sample
 * document behaves oddly is whether their own would too.
 *
 * The documents are clearly labelled as samples in the UI and are deletable
 * like any other. They are fictional, and the copy says so: a demo corpus
 * presented as real hotel policy is the same category of dishonesty the
 * advisor is built to avoid.
 */

const SAMPLES = [
  { file: "front-office-sop.md", label: "Front Office and Reservations SOP" },
  { file: "housekeeping-sop.md", label: "Housekeeping SOP" },
  { file: "fnb-banquet-sop.md", label: "Food, Beverage and Banquets" },
  { file: "engineering-maintenance.md", label: "Engineering and Maintenance" },
  { file: "safety-emergency.md", label: "Safety and Emergency Response" },
  { file: "hr-staff-policy.md", label: "People and Employment Policy" },
  { file: "commercial-contracts.md", label: "Rates, Contracts and Procurement" },
];

export function LoadSamples() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function loadOne(file: string) {
    const response = await fetch(`/samples/${file}`);
    const text = await response.text();
    const blob = new Blob([text], { type: "text/markdown" });

    const reserved = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file, content_type: "text/markdown" }),
    });
    if (!reserved.ok) throw new Error("could not reserve");

    const { document_id, upload_url, required_headers } = (await reserved.json()) as {
      document_id: string;
      upload_url: string;
      required_headers: Record<string, string>;
    };

    const put = await fetch(upload_url, {
      method: "PUT",
      headers: required_headers,
      body: blob,
    });
    if (!put.ok) throw new Error("could not upload");

    const confirmed = await fetch(`/api/documents/${document_id}/ingest`, {
      method: "POST",
    });
    if (!confirmed.ok) throw new Error("could not queue ingestion");
  }

  async function load() {
    setLoading(true);
    setError(null);
    setDone(0);

    try {
      // Sequential. Seven parallel ingestion jobs would contend for the same
      // worker and the same provider rate limit, and finish no sooner.
      for (const sample of SAMPLES) {
        await loadOne(sample.file);
        setDone((count) => count + 1);
        router.refresh();
      }
    } catch {
      setError("Some samples did not load. You can try again or upload your own.");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-mint/[0.10] p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-charcoal/60" aria-hidden />
        <p className="text-sm font-semibold text-charcoal">
          Nothing uploaded yet? Start with a sample hotel
        </p>
      </div>
      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-charcoal/70">
        Seven complete documents from a fictional hotel group — front office,
        housekeeping, F&amp;B, engineering, safety, HR and commercial contracts.
        Enough to ask real questions in about a minute. Delete them whenever you like.
      </p>

      <button
        onClick={() => void load()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal/90 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading {done + 1} of {SAMPLES.length}…
          </>
        ) : (
          <>Load sample documents</>
        )}
      </button>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <p className="mt-3 text-[11px] text-charcoal/45">
        These are made up for demonstration. They are not any real hotel&rsquo;s policy.
      </p>
    </div>
  );
}
