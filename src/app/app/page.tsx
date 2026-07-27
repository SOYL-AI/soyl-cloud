import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Container } from "@/components/ui/Container";
import { apiFetch } from "@/lib/api-client";
import { requireSession } from "@/lib/session";

/**
 * The first authenticated page.
 *
 * Deliberately plain. Its job in M2 is to prove the whole chain end to end —
 * cookie → JWT → session token → API → `Principal` → `app.tenant_id` → RLS —
 * with a real request rather than a test. M3 builds the product on top of it.
 *
 * A Server Component: the session token is read server-side and used to call
 * the API, and neither ever reaches the browser.
 */

export const dynamic = "force-dynamic";

type Property = { id: string; name: string; rooms_total: number };
type Tenant = { id: string; name: string; slug: string };

export default async function AppPage() {
  const session = await requireSession("/app");

  // 409 is the honest answer for a signed-in user who has not created a tenant
  // yet, and it is what the onboarding prompt below keys off.
  const [tenant, properties] = await Promise.all([
    apiFetch<Tenant>("/v1/tenants/current", { sessionToken: session.sessionToken }),
    apiFetch<Property[]>("/v1/properties", { sessionToken: session.sessionToken }),
  ]);

  const needsOnboarding = tenant.ok === false && tenant.status === 409;

  return (
    <main className="min-h-screen bg-[var(--color-soyl-gray-50)] py-16">
      <Container size="md">
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
              {tenant.ok ? tenant.data.name : "Welcome"}
            </h1>
            {!session.isEmailVerified && (
              <p className="mt-2 text-sm text-[var(--color-soyl-gray-600)]">
                Your email address is not confirmed yet. Check your inbox for the
                link we sent.
              </p>
            )}
          </div>
          <SignOutButton />
        </div>

        {needsOnboarding ? (
          <div className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-8">
            <h2 className="text-xl font-bold text-[var(--color-soyl-charcoal)]">
              Set up your property
            </h2>
            <p className="mt-2 text-[var(--color-soyl-gray-600)]">
              You are signed in but have not created a workspace yet. Onboarding
              lands in the next milestone — until then this is where it will be.
            </p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-8">
            <h2 className="text-xl font-bold text-[var(--color-soyl-charcoal)]">
              Your properties
            </h2>

            {properties.ok && properties.data.length > 0 ? (
              <ul className="mt-6 divide-y divide-[var(--color-soyl-gray-200)]">
                {properties.data.map((property) => (
                  <li key={property.id} className="flex justify-between py-4">
                    <span className="font-semibold text-[var(--color-soyl-charcoal)]">
                      {property.name}
                    </span>
                    <span className="text-[var(--color-soyl-gray-600)]">
                      {property.rooms_total} rooms
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[var(--color-soyl-gray-600)]">
                No properties yet.
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-[var(--color-soyl-gray-500)]">
          <Link href="/" className="underline hover:text-[var(--color-soyl-charcoal)]">
            Back to soyl.cloud
          </Link>
        </p>
      </Container>
    </main>
  );
}
