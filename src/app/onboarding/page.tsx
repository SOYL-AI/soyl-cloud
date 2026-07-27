"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Check, Hotel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * Two steps: the workspace, then the first property.
 *
 * Kept to two because `UPDATE.md` §3 asks for onboarding completable in under
 * five minutes, and every field here is one a hotel owner can answer without
 * looking anything up. Country, timezone and currency are inferred rather than
 * asked — they are changeable later and nobody abandons a signup over a
 * timezone dropdown.
 *
 * Nothing is written until the last step, so backing up loses nothing and the
 * half-finished state — a workspace with no property — cannot be reached by
 * closing the tab.
 */

type Step = 0 | 1;

/** "The Grand Resort, Goa" → "the-grand-resort-goa". */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "LK", name: "Sri Lanka" },
  { code: "NP", name: "Nepal" },
  { code: "TH", name: "Thailand" },
  { code: "SG", name: "Singapore" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workspaceName, setWorkspaceName] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("IN");
  const [propertyName, setPropertyName] = useState("");
  const [roomsTotal, setRoomsTotal] = useState("");

  // The address follows the name until someone edits it, then it stops — the
  // usual behaviour, and the one that surprises nobody.
  const effectiveSlug = slugTouched ? slug : toSlug(workspaceName);

  const stepOneValid = workspaceName.trim().length > 1 && effectiveSlug.length > 1;
  const stepTwoValid = propertyName.trim().length > 1;

  const steps = useMemo(
    () => [
      { title: "Your workspace", icon: Building2 },
      { title: "Your first property", icon: Hotel },
    ],
    [],
  );

  async function onSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName: workspaceName.trim(),
          slug: effectiveSlug,
          country,
          propertyName: propertyName.trim(),
          roomsTotal: Number(roomsTotal) || 0,
        }),
      });

      if (response.status === 201) {
        router.replace("/app");
        return;
      }

      const body = (await response.json().catch(() => null)) as
        | { message?: string; workspaceCreated?: boolean }
        | null;

      if (body?.workspaceCreated) {
        // The workspace exists; sending them back would collide on the slug.
        router.replace("/app");
        return;
      }

      if (response.status === 401) {
        router.replace("/login?next=%2Fonboarding");
        return;
      }

      setError(body?.message ?? "Something went wrong. Please try again.");
      // A slug clash is a step-one problem, so put them back where they can
      // fix it rather than stranding them on step two.
      if (response.status === 409) setStep(0);
    } catch {
      setError("We could not reach our server. Check your connection and try again.");
    }

    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-[var(--color-soyl-gray-50)] py-16">
      {/* The same radial glow the marketing hero uses, so this reads as the
          same product rather than an admin tool bolted on. */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-[var(--gradient-glow)]" />

      <Container size="sm">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-10 text-center">
            <Badge variant="primary" className="mx-auto mb-6 inline-flex">
              Setting up
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] md:text-5xl">
              Let&apos;s get you set up
            </h1>
            <p className="mt-4 text-lg text-[var(--color-soyl-gray-600)]">
              Two short steps. You can change any of this later.
            </p>
          </div>

          {/* Progress */}
          <ol className="mb-8 flex items-center gap-4" aria-label="Progress">
            {steps.map((entry, index) => {
              const done = index < step;
              const current = index === step;
              const Icon = entry.icon;

              return (
                <li key={entry.title} className="flex flex-1 items-center gap-3">
                  <span
                    aria-current={current ? "step" : undefined}
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      done
                        ? "bg-[var(--color-soyl-mint-dark)] text-white"
                        : current
                          ? "bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)]"
                          : "bg-white text-[var(--color-soyl-gray-400)] border border-[var(--color-soyl-gray-200)]",
                    ].join(" ")}
                  >
                    {done ? <Check size={18} /> : <Icon size={18} />}
                  </span>
                  <span
                    className={[
                      "text-sm font-semibold",
                      current || done
                        ? "text-[var(--color-soyl-charcoal)]"
                        : "text-[var(--color-soyl-gray-400)]",
                    ].join(" ")}
                  >
                    {entry.title}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-8 shadow-sm md:p-10">
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              >
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 0 ? (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="workspaceName"
                      className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
                    >
                      Hotel or group name
                    </label>
                    <input
                      id="workspaceName"
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      placeholder="The Grand Resort Group"
                      autoFocus
                      maxLength={200}
                      className="h-12 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] px-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="slug"
                      className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
                    >
                      Workspace address
                    </label>
                    <div className="flex items-center rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] focus-within:ring-2 focus-within:ring-[var(--color-soyl-mint-dark)]">
                      <span className="pl-4 text-[var(--color-soyl-gray-400)]">soyl.cloud/</span>
                      <input
                        id="slug"
                        value={effectiveSlug}
                        onChange={(event) => {
                          setSlugTouched(true);
                          setSlug(toSlug(event.target.value));
                        }}
                        placeholder="the-grand-resort"
                        maxLength={63}
                        className="h-12 flex-1 bg-transparent pr-4 focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-[var(--color-soyl-gray-500)]">
                      Lowercase letters, numbers and hyphens. This is how your team
                      will reach your workspace.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="country"
                      className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
                    >
                      Country
                    </label>
                    <select
                      id="country"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="h-12 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] px-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)]"
                    >
                      {COUNTRIES.map((entry) => (
                        <option key={entry.code} value={entry.code}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    size="lg"
                    disabled={!stepOneValid}
                    onClick={() => setStep(1)}
                    className="w-full"
                  >
                    Continue
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="property"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="propertyName"
                      className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
                    >
                      Property name
                    </label>
                    <input
                      id="propertyName"
                      value={propertyName}
                      onChange={(event) => setPropertyName(event.target.value)}
                      placeholder="The Grand Resort, Goa"
                      autoFocus
                      maxLength={200}
                      className="h-12 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] px-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)]"
                    />
                    <p className="text-xs text-[var(--color-soyl-gray-500)]">
                      You can add more properties once you are in.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="roomsTotal"
                      className="text-sm font-semibold text-[var(--color-soyl-charcoal)]"
                    >
                      Number of rooms{" "}
                      <span className="font-normal text-[var(--color-soyl-gray-500)]">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="roomsTotal"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100000}
                      value={roomsTotal}
                      onChange={(event) => setRoomsTotal(event.target.value)}
                      placeholder="84"
                      className="h-12 rounded-xl border border-[var(--color-soyl-gray-200)] bg-[var(--color-soyl-gray-50)] px-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint-dark)]"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(0)}
                      disabled={submitting}
                      className="sm:w-auto"
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      loading={submitting}
                      disabled={!stepTwoValid}
                      onClick={() => void onSubmit()}
                      className="flex-1"
                    >
                      Create workspace
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </main>
  );
}
