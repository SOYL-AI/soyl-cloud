"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";

/**
 * Add a property without leaving the workspace.
 *
 * A hand-built dialog rather than a library: the repo has no headless UI
 * dependency and this needs three behaviours, all of which are cheaper to
 * write than to justify adding a package for — Escape closes it, focus moves
 * into it on open and back to the trigger on close, and the backdrop is inert
 * to clicks that started inside the panel.
 */
export function AddPropertyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus the first field rather than the panel, so a keyboard user can type
    // immediately instead of tabbing to find the input.
    nameRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setError(null);
    // Focus has to go somewhere deliberate, or it falls to the top of the
    // document and a keyboard user starts over.
    triggerRef.current?.focus();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? "").trim(),
          rooms_total: Number(form.get("rooms_total")) || 0,
        }),
      });

      if (response.ok) {
        setOpen(false);
        // The list is server-rendered, so refresh rather than mutating local
        // state — one source of truth, and it reflects what the API actually
        // stored rather than what we hoped it would.
        router.refresh();
        setSubmitting(false);
        return;
      }

      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "We could not add that property.");
    } catch {
      setError("We could not reach our server. Check your connection and try again.");
    }

    setSubmitting(false);
  }

  return (
    <>
      <Button ref={triggerRef} size="md" onClick={() => setOpen(true)}>
        <Plus size={18} className="mr-2" />
        Add property
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-property-title"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.15 }}
              // Without this, releasing a drag that began inside the panel
              // counts as a backdrop click and closes the form mid-edit.
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-8 shadow-xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <h2
                  id="add-property-title"
                  className="text-xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]"
                >
                  Add a property
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="rounded-lg p-1 text-[var(--color-soyl-gray-400)] transition-colors hover:bg-[var(--color-soyl-gray-100)] hover:text-[var(--color-soyl-charcoal)]"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={onSubmit} className="flex flex-col gap-6">
                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
                  >
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="property-name"
                    className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
                  >
                    Property name
                  </label>
                  <input
                    ref={nameRef}
                    id="property-name"
                    name="name"
                    required
                    maxLength={200}
                    placeholder="The Grand Resort, Goa"
                    className="h-12 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] px-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="property-rooms"
                    className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
                  >
                    Number of rooms{" "}
                    <span className="font-normal text-[var(--color-soyl-gray-500)]">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="property-rooms"
                    name="rooms_total"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100000}
                    placeholder="84"
                    className="h-12 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] px-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)]"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" size="md" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" size="md" loading={submitting}>
                    Add property
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
