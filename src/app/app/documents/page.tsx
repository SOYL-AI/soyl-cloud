import { redirect } from "next/navigation";

import { DocumentList, type DocumentRow } from "@/components/workspace/DocumentList";
import { DocumentUploader } from "@/components/workspace/DocumentUploader";
import { PageBody, PageHeader } from "@/components/workspace/PageHeader";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { apiFetch } from "@/lib/api-client";
import { requireSession } from "@/lib/session";

/**
 * The knowledge base.
 *
 * Server-rendered so the first paint already has the list; the client takes
 * over only to poll while something is still processing.
 */

export const dynamic = "force-dynamic";

type Tenant = { id: string; name: string };

export default async function DocumentsPage() {
  const session = await requireSession("/app/documents");

  const tenant = await apiFetch<Tenant>("/v1/tenants/current", {
    sessionToken: session.sessionToken,
  });

  if (!tenant.ok && tenant.status === 409) {
    redirect("/onboarding");
  }

  const documents = await apiFetch<DocumentRow[]>("/v1/documents", {
    sessionToken: session.sessionToken,
  });

  const list = documents.ok ? documents.data : [];
  const ready = list.filter((document) => document.status === "ready").length;

  return (
    <WorkspaceShell
      workspaceName={tenant.ok ? tenant.data.name : null}
      userEmail={session.email}
    >
      <PageBody>
        <PageHeader
          eyebrow="Knowledge base"
          title="Your documents"
          description="Everything you upload here becomes searchable. Answers will cite the exact document and section they came from."
        />

        <DocumentUploader />

        <section className="mt-10" aria-labelledby="uploaded-heading">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2
              id="uploaded-heading"
              className="text-sm font-semibold uppercase tracking-wide text-[var(--color-soyl-gray-500)]"
            >
              Uploaded
            </h2>
            {list.length > 0 && (
              <span className="text-sm text-[var(--color-soyl-gray-500)]">
                {ready} of {list.length} indexed
              </span>
            )}
          </div>

          <div className="rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white px-6">
            <DocumentList initial={list} />
          </div>
        </section>
      </PageBody>
    </WorkspaceShell>
  );
}
