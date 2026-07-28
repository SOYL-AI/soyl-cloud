import Link from "next/link";
import { redirect } from "next/navigation";

import { DocumentList, type DocumentRow } from "@/components/workspace/DocumentList";
import { DocumentUploader } from "@/components/workspace/DocumentUploader";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { apiFetch } from "@/lib/api-client";
import { requireSession } from "@/lib/session";

/**
 * The knowledge base.
 *
 * Server-rendered so the first paint already has the list; the client
 * component takes over polling only while something is still processing.
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

  return (
    <div className="min-h-screen bg-[var(--color-soyl-gray-50)]">
      <WorkspaceHeader
        workspaceName={tenant.ok ? tenant.data.name : null}
        userEmail={session.email}
      />

      <main className="py-12">
        <Container size="md">
          <div className="mb-10">
            <Badge variant="secondary" className="mb-4 inline-flex">
              Knowledge base
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
              Your documents
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--color-soyl-gray-600)]">
              Everything you upload here becomes searchable. Answers cite the
              exact document and section they came from.
            </p>
          </div>

          <DocumentUploader />

          <section className="mt-10 rounded-[28px] border border-[var(--color-soyl-gray-200)] bg-white p-8">
            <h2 className="mb-2 text-xl font-bold text-[var(--color-soyl-charcoal)]">
              Uploaded
            </h2>
            <DocumentList initial={documents.ok ? documents.data : []} />
          </section>

          <p className="mt-10 text-center text-sm text-[var(--color-soyl-gray-500)]">
            <Link href="/app" className="underline hover:text-[var(--color-soyl-charcoal)]">
              Back to your workspace
            </Link>
          </p>
        </Container>
      </main>
    </div>
  );
}
