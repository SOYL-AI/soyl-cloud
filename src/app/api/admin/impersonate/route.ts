import { cookies } from "next/headers";

import { apiFetch } from "@/lib/api-client";
import { IMPERSONATION_COOKIE, readSession } from "@/lib/session";

/**
 * Start and stop impersonation.
 *
 * The API mints the session and writes the audit rows; this handler's only job
 * is to put the resulting token somewhere the browser will send back. That
 * somewhere is an **httpOnly** cookie, so no script on the page can read a
 * live credential for someone else's tenant.
 *
 * `ignoreImpersonation` on the read is what stops an impersonation being used
 * to start another one. The API refuses that too — an impersonated session
 * cannot reach `/v1/admin` — so this is the second of two locks, not the only
 * one.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

type Minted = {
  session_token: string;
  expires_at: string;
  tenant_id: string;
  tenant_name: string;
  acting_as: string;
};

export async function POST(request: Request) {
  const session = await readSession({ ignoreImpersonation: true });
  if (!session) return json({ message: "Your session has expired." }, 401);

  const body = (await request.json().catch(() => null)) as { tenant_id?: unknown } | null;
  if (typeof body?.tenant_id !== "string") {
    return json({ message: "A tenant is required." }, 422);
  }

  const result = await apiFetch<Minted>(
    `/v1/admin/tenants/${encodeURIComponent(body.tenant_id)}/impersonate`,
    { method: "POST", sessionToken: session.sessionToken },
  );

  if (!result.ok) {
    // 404 means "not staff" or "no such tenant" — the API deliberately does
    // not distinguish, and neither does this.
    if (result.status === 404) return json({ message: "Not found." }, 404);
    if (result.status === 409) return json({ message: result.detail }, 409);
    console.error(`[admin] impersonate failed ${result.status}: ${result.detail}`);
    return json({ message: "Could not start." }, 502);
  }

  const expiresAt = new Date(result.data.expires_at);
  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, JSON.stringify({
    token: result.data.session_token,
    tenantName: result.data.tenant_name,
    actingAs: result.data.acting_as,
    expiresAt: result.data.expires_at,
  }), {
    httpOnly: true,
    // Not `strict`: the panel navigates to /app immediately afterwards, and a
    // strict cookie is withheld on a cross-site top-level navigation, which
    // would land staff in their own workspace wondering what happened.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Matches the session row's own lifetime. The cookie expiring first would
    // strand a live impersonated session with no way to end it; the row
    // expiring first is fine, because the API stops honouring the token and
    // `readSession` drops the banner on the next load.
    expires: expiresAt,
  });

  return json({ tenant_name: result.data.tenant_name, acting_as: result.data.acting_as }, 200);
}

/** End it: revoke the session server-side, then drop the cookie. */
export async function DELETE() {
  const store = await cookies();
  const raw = store.get(IMPERSONATION_COOKIE)?.value;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed.token) {
        // Revoked at the API rather than merely forgotten here. Deleting only
        // the cookie would leave a live token that could be replayed for the
        // rest of its thirty minutes by anyone who had captured it.
        await apiFetch("/v1/admin/impersonation/end", {
          method: "POST",
          sessionToken: parsed.token,
        });
      }
    } catch {
      // A malformed cookie has nothing to revoke. Clearing it is still right.
    }
  }

  store.delete(IMPERSONATION_COOKIE);
  return json({ ok: true }, 200);
}
