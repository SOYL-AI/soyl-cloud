/**
 * The admin panel's data layer.
 *
 * Every screen goes through `adminFetch`, which reads the *real* session —
 * never an impersonated one — and calls `/v1/admin`. Authorisation is not
 * decided here and cannot be: the API asks Postgres `core.is_staff()`, and this
 * module has no way to know the answer. What it does is turn the API's 404 into
 * a Next.js `notFound()`, so a customer who guesses the URL gets the same page
 * they would get for any other path that does not exist.
 *
 * That is why the API answers a non-staff caller with 404 rather than 403: 403
 * confirms the panel exists.
 *
 * Types and formatters live in `admin-types.ts` and are re-exported, so a
 * screen imports one module and the test suite can import the half that has no
 * Next.js dependency.
 */

import { notFound, redirect } from "next/navigation";

import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

export * from "@/lib/admin-types";

/**
 * Fetch from the admin API as the signed-in staff member.
 *
 * `ignoreImpersonation` is the important argument. Without it, a staff member
 * who started an impersonation and then opened the admin panel would send the
 * customer's token — which the API refuses on `/v1/admin`, so the panel would
 * appear to have logged them out.
 */
export async function adminFetch<T>(path: string): Promise<T> {
  const session = await readSession({ ignoreImpersonation: true });
  if (!session) redirect(`/login?next=${encodeURIComponent("/admin")}`);

  const result = await apiFetch<T>(path, {
    sessionToken: session.sessionToken,
    // The funnel and cost queries aggregate across every tenant, which is
    // slower than any CRUD call this default was chosen for.
    timeoutMs: 20_000,
  });

  if (result.ok) return result.data;

  // 404 covers both "you are not staff" and "that turn does not exist". Both
  // should render the same page, which is the point.
  if (result.status === 404) notFound();
  if (result.status === 401) redirect(`/login?next=${encodeURIComponent("/admin")}`);

  throw new Error(`admin ${path} failed: ${result.status} ${result.detail}`);
}

/** Whether the signed-in user is staff at all — the nav renders on this. */
export async function isStaff(): Promise<boolean> {
  const session = await readSession({ ignoreImpersonation: true });
  if (!session) return false;

  const result = await apiFetch<unknown>("/v1/admin/tenants", {
    sessionToken: session.sessionToken,
  });
  return result.ok;
}
