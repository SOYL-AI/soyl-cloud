import { redirect } from "next/navigation";

import { AskSurface } from "@/components/workspace/AskSurface";
import { PageBody, PageHeader } from "@/components/workspace/PageHeader";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { apiFetch } from "@/lib/api-client";
import { requireSession } from "@/lib/session";

/**
 * The ask surface.
 *
 * Server-rendered only far enough to know whether there is anything to ask
 * about — the empty state for a workspace with no documents is a different
 * page from the one with them, and rendering the wrong one for a moment is the
 * kind of flicker that makes a product feel unfinished.
 */

export const dynamic = "force-dynamic";

type Tenant = { id: string; name: string };
type DocumentRow = { status: string };

export default async function AskPage() {
  const session = await requireSession("/app/ask");

  const tenant = await apiFetch<Tenant>("/v1/tenants/current", {
    sessionToken: session.sessionToken,
  });

  if (!tenant.ok && tenant.status === 409) {
    redirect("/onboarding");
  }

  const documents = await apiFetch<DocumentRow[]>("/v1/documents", {
    sessionToken: session.sessionToken,
  });

  const ready = documents.ok
    ? documents.data.filter((document) => document.status === "ready").length
    : 0;

  return (
    <WorkspaceShell
      workspaceName={tenant.ok ? tenant.data.name : null}
      userEmail={session.email}
    >
      <PageBody>
        <PageHeader
          eyebrow="Knowledge"
          title="Ask"
          description={
            ready > 0
              ? `Answering from ${ready} ${ready === 1 ? "document" : "documents"}. Every answer cites its source.`
              : "Upload a document and this becomes the fastest way to use it."
          }
        />
        <AskSurface hasDocuments={ready > 0} />
      </PageBody>
    </WorkspaceShell>
  );
}
