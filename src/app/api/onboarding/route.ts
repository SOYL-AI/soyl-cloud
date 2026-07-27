import { apiFetch } from "@/lib/api-client";
import { readSession } from "@/lib/session";

/**
 * Creates a workspace and its first property in one call.
 *
 * One request rather than two because the two are a single decision from the
 * hotel's point of view, and a half-finished onboarding — a tenant with no
 * property — is a state nobody should be able to reach by closing a tab.
 *
 * If the property fails after the tenant succeeds, the tenant is kept and
 * reported: the user is a valid owner at that point and re-running would
 * collide on the slug. The UI sends them on to add a property from the
 * workspace instead.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-transform" } as const;

type TenantOut = { id: string; name: string; slug: string };
type PropertyOut = { id: string; name: string };

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return json({ message: "Your session has expired. Please sign in again." }, 401);
  }

  const body = (await request.json().catch(() => null)) as {
    workspaceName?: unknown;
    slug?: unknown;
    country?: unknown;
    propertyName?: unknown;
    roomsTotal?: unknown;
  } | null;

  const workspaceName = typeof body?.workspaceName === "string" ? body.workspaceName.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const country = typeof body?.country === "string" ? body.country.trim() : "IN";
  const propertyName = typeof body?.propertyName === "string" ? body.propertyName.trim() : "";
  const roomsTotal = Number.isFinite(Number(body?.roomsTotal)) ? Number(body?.roomsTotal) : 0;

  if (!workspaceName || !slug || !propertyName) {
    return json({ message: "Workspace name, address and property name are all required." }, 422);
  }

  const tenant = await apiFetch<TenantOut>("/v1/tenants", {
    method: "POST",
    sessionToken: session.sessionToken,
    body: { name: workspaceName, slug, country },
  });

  if (!tenant.ok) {
    // 409 from Postgres' unique constraint on slug arrives as a 500 from the
    // API today; both mean "pick another address" to the person typing.
    if (tenant.status === 422) {
      return json({ message: tenant.detail || "That workspace address is not valid." }, 422);
    }
    console.error(`[onboarding] tenant create failed ${tenant.status}: ${tenant.detail}`);
    return json(
      { message: "That workspace address may already be taken. Try another." },
      tenant.status === 401 ? 401 : 409,
    );
  }

  const property = await apiFetch<PropertyOut>("/v1/properties", {
    method: "POST",
    sessionToken: session.sessionToken,
    body: { name: propertyName, rooms_total: roomsTotal },
  });

  if (!property.ok) {
    console.error(`[onboarding] property create failed ${property.status}: ${property.detail}`);
    // The workspace exists and the caller owns it. Say so, rather than
    // implying nothing happened and inviting a retry that cannot succeed.
    return json(
      {
        message: "Your workspace was created, but the property was not. Add it from your workspace.",
        workspaceCreated: true,
      },
      207,
    );
  }

  return json({ tenant: tenant.data, property: property.data }, 201);
}
