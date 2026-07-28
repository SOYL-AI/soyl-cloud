import { AlertCircle, Building2, FileText, MessageSquareText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddPropertyDialog } from "@/components/workspace/AddPropertyDialog";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { apiFetch } from "@/lib/api-client";
import { requireSession } from "@/lib/session";

/**
 * The workspace.
 *
 * A Server Component: the session token is read server-side and used to call
 * the API, and neither it nor the API's address reaches the browser.
 *
 * It proves the whole chain with a real request on every load — cookie → JWT →
 * session token → API → `Principal` → `app.tenant_id` → RLS. If tenant
 * isolation broke, this page would be where it showed.
 */

export const dynamic = "force-dynamic";

type Property = { id: string; name: string; rooms_total: number; timezone: string };
type Tenant = { id: string; name: string; slug: string };

export default async function AppPage() {
  const session = await requireSession("/app");

  const tenant = await apiFetch<Tenant>("/v1/tenants/current", {
    sessionToken: session.sessionToken,
  });

  // 409 means signed in but no workspace yet. Onboarding is a page, not an
  // empty state — sending them there is the whole point of the status code.
  if (!tenant.ok && tenant.status === 409) {
    redirect("/onboarding");
  }

  const properties = await apiFetch<Property[]>("/v1/properties", {
    sessionToken: session.sessionToken,
  });

  const workspaceName = tenant.ok ? tenant.data.name : null;
  const list = properties.ok ? properties.data : [];

  return (
    <div className="min-h-screen bg-[var(--color-soyl-gray-50)]">
      <WorkspaceHeader workspaceName={workspaceName} userEmail={session.email} />

      <main className="py-12">
        <Container size="lg">
          {!session.isEmailVerified && (
            <div
              role="status"
              className="mb-8 flex items-start gap-3 rounded-2xl border border-[var(--color-soyl-warning)]/30 bg-[var(--color-soyl-warning)]/10 p-4"
            >
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-[var(--color-soyl-warning)]"
                aria-hidden="true"
              />
              <div className="text-sm text-[var(--color-soyl-charcoal)]">
                <p className="font-semibold">Confirm your email address</p>
                <p className="mt-1 text-[var(--color-soyl-gray-600)]">
                  We sent you a link when you signed up. You can keep working in
                  the meantime.
                </p>
              </div>
            </div>
          )}

          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Badge variant="secondary" className="mb-4 inline-flex">
                Workspace
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
                {workspaceName ?? "Your workspace"}
              </h1>
              <p className="mt-2 text-[var(--color-soyl-gray-600)]">
                {list.length === 1
                  ? "1 property"
                  : `${list.length} properties`}
              </p>
            </div>
            <AddPropertyDialog />
          </div>

          <section aria-labelledby="properties-heading">
            <h2 id="properties-heading" className="sr-only">
              Properties
            </h2>

            {list.length > 0 ? (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((property) => (
                  <li
                    key={property.id}
                    className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)]">
                      <Building2 size={22} />
                    </span>
                    <h3 className="text-lg font-bold text-[var(--color-soyl-charcoal)]">
                      {property.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-soyl-gray-600)]">
                      {property.rooms_total > 0
                        ? `${property.rooms_total} rooms`
                        : "Rooms not set"}
                      {" · "}
                      {property.timezone}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-[28px] border border-dashed border-[var(--color-soyl-gray-200)] bg-white p-12 text-center">
                <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-soyl-gray-100)] text-[var(--color-soyl-gray-400)]">
                  <Plus size={26} />
                </span>
                <h3 className="text-lg font-bold text-[var(--color-soyl-charcoal)]">
                  No properties yet
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-[var(--color-soyl-gray-600)]">
                  Add your first property to start uploading documents.
                </p>
              </div>
            )}
          </section>

          {/* What comes next, stated honestly rather than mocked up. A tile
              that looks clickable and is not is worse than one that says so. */}
          <section className="mt-12" aria-labelledby="next-heading">
            <h2
              id="next-heading"
              className="mb-6 text-sm font-semibold uppercase tracking-wide text-[var(--color-soyl-gray-500)]"
            >
              Knowledge base
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: FileText,
                  title: "Your documents",
                  body: "Upload SOPs, policies, contracts and rate sheets. We index them so they can be asked about.",
                  href: "/app/documents",
                },
                {
                  icon: MessageSquareText,
                  title: "Ask anything",
                  body: "Plain questions about your own documents, answered with the exact source cited.",
                },
              ].map((entry) => {
                // A tile that goes somewhere is a link; one that does not is a
                // div. Making the second look clickable is worse than saying so.
                const body = (
                  <>
                    <span
                      className={[
                        "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                        entry.href
                          ? "bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)]"
                          : "bg-[var(--color-soyl-gray-100)] text-[var(--color-soyl-gray-400)]",
                      ].join(" ")}
                    >
                      <entry.icon size={22} />
                    </span>
                    <h3
                      className={[
                        "text-lg font-bold",
                        entry.href
                          ? "text-[var(--color-soyl-charcoal)]"
                          : "text-[var(--color-soyl-gray-600)]",
                      ].join(" ")}
                    >
                      {entry.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-soyl-gray-500)]">{entry.body}</p>
                  </>
                );

                return entry.href ? (
                  <Link
                    key={entry.title}
                    href={entry.href}
                    className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    key={entry.title}
                    className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white/60 p-6"
                  >
                    {body}
                  </div>
                );
              })}
            </div>
          </section>

          <p className="mt-12 text-center text-sm text-[var(--color-soyl-gray-500)]">
            <Link href="/" className="underline hover:text-[var(--color-soyl-charcoal)]">
              Back to soyl.cloud
            </Link>
          </p>
        </Container>
      </main>
    </div>
  );
}