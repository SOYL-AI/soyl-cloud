import { ArrowRight, FileText, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddPropertyDialog } from "@/components/workspace/AddPropertyDialog";
import { PageBody, PageHeader } from "@/components/workspace/PageHeader";
import { PropertyGrid, type PropertyRow } from "@/components/workspace/PropertyGrid";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { apiFetch } from "@/lib/api-client";
import { requireSession } from "@/lib/session";

/**
 * The workspace overview.
 *
 * A Server Component: the session token is read server-side and used to call
 * the API, and neither it nor the API's address reaches the browser. It also
 * proves the whole chain on every load — cookie → JWT → session token → API →
 * Principal → app.tenant_id → RLS.
 */

export const dynamic = "force-dynamic";

type Tenant = { id: string; name: string; slug: string };
type DocumentSummary = { id: string; status: string; chunk_count: number };

export default async function AppPage() {
  const session = await requireSession("/app");

  const tenant = await apiFetch<Tenant>("/v1/tenants/current", {
    sessionToken: session.sessionToken,
  });

  // 409 is the honest answer for a signed-in user with no workspace, and
  // sending them to onboarding is the whole reason it is 409 and not 401.
  if (!tenant.ok && tenant.status === 409) {
    redirect("/onboarding");
  }

  const [properties, documents] = await Promise.all([
    apiFetch<PropertyRow[]>("/v1/properties", { sessionToken: session.sessionToken }),
    apiFetch<DocumentSummary[]>("/v1/documents", { sessionToken: session.sessionToken }),
  ]);

  const propertyList = properties.ok ? properties.data : [];
  const documentList = documents.ok ? documents.data : [];
  const ready = documentList.filter((document) => document.status === "ready");
  const sections = ready.reduce((total, document) => total + document.chunk_count, 0);

  return (
    <WorkspaceShell
      workspaceName={tenant.ok ? tenant.data.name : null}
      userEmail={session.email}
    >
      <PageBody>
        <PageHeader
          eyebrow="Overview"
          title={tenant.ok ? tenant.data.name : "Your workspace"}
          description={
            !session.isEmailVerified
              ? "Check your inbox to confirm your email address. You can keep working in the meantime."
              : undefined
          }
          action={<AddPropertyDialog />}
        />

        {/* Three honest counts. A dashboard of empty charts is worse than no
            dashboard, because it implies data that is not there. */}
        <dl className="mb-12 grid gap-4 sm:grid-cols-3">
          <Stat label="Properties" value={propertyList.length} />
          <Stat label="Documents indexed" value={ready.length} />
          <Stat label="Sections searchable" value={sections} />
        </dl>

        <section className="mb-12" aria-labelledby="properties-heading">
          <h2
            id="properties-heading"
            className="mb-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-soyl-gray-500)]"
          >
            Properties
          </h2>
          <PropertyGrid properties={propertyList} />
        </section>

        <section aria-labelledby="next-heading">
          <h2
            id="next-heading"
            className="mb-5 text-sm font-semibold uppercase tracking-wide text-[var(--color-soyl-gray-500)]"
          >
            Your knowledge base
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Link
              href="/app/documents"
              className="group rounded-[24px] border border-[var(--color-soyl-gray-200)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--color-soyl-mint)] hover:shadow-lg"
            >
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)] transition-colors group-hover:bg-[var(--color-soyl-mint)] group-hover:text-white">
                <FileText size={20} />
              </span>
              <h3 className="flex items-center gap-2 font-bold text-[var(--color-soyl-charcoal)]">
                Documents
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="mt-1 text-sm text-[var(--color-soyl-gray-600)]">
                {documentList.length === 0
                  ? "Upload your SOPs, policies and contracts to make them searchable."
                  : `${documentList.length} uploaded · ${sections} sections indexed`}
              </p>
            </Link>

            {/* Not a link, and it does not pretend to be one. */}
            <div className="rounded-[24px] border border-[var(--color-soyl-gray-200)] bg-white/60 p-6">
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-soyl-gray-100)] text-[var(--color-soyl-gray-400)]">
                <MessageSquareText size={20} />
              </span>
              <h3 className="flex items-center gap-2 font-bold text-[var(--color-soyl-gray-600)]">
                Ask
                <span className="rounded-full bg-[var(--color-soyl-gray-100)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-soyl-gray-500)]">
                  Soon
                </span>
              </h3>
              <p className="mt-1 text-sm text-[var(--color-soyl-gray-500)]">
                Plain questions about your own documents, answered with the exact
                source cited.
              </p>
            </div>
          </div>
        </section>
      </PageBody>
    </WorkspaceShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-[var(--color-soyl-gray-200)] bg-white px-6 py-5">
      <dt className="text-sm text-[var(--color-soyl-gray-600)]">{label}</dt>
      <dd className="mt-1 text-3xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
        {value}
      </dd>
    </div>
  );
}
