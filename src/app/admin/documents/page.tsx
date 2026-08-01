import Link from "next/link";

import { ReprocessButton } from "@/components/admin/ReprocessButton";
import { AdminShell, Empty, StatusPill, Table, Td, Th } from "@/components/admin/Shell";
import { adminFetch, count, when, type AdminDocument, type TenantSummary } from "@/lib/admin";

/**
 * Documents — ingestion status, failures with the actual error, reprocess
 * (`UPDATE.md` §11).
 *
 * Failures sort first, because this screen exists to be opened when something
 * has gone wrong. A list ordered by date makes you hunt for the row you came
 * for.
 */

type Search = { tenant_id?: string; status?: string };

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const search = new URLSearchParams();
  if (params.tenant_id) search.set("tenant_id", params.tenant_id);
  if (params.status) search.set("status", params.status);
  const suffix = search.toString() ? `?${search}` : "";

  const [{ documents }, { tenants }] = await Promise.all([
    adminFetch<{ documents: AdminDocument[] }>(`/v1/admin/documents${suffix}`),
    adminFetch<{ tenants: TenantSummary[] }>("/v1/admin/tenants"),
  ]);

  const failed = documents.filter((document) => document.status === "failed").length;

  return (
    <AdminShell
      title="Documents"
      description={
        failed > 0
          ? `${count(failed)} ${failed === 1 ? "document has" : "documents have"} failed ingestion.`
          : "Nothing is failing ingestion."
      }
    >
      <form method="GET" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          Tenant
          <select
            name="tenant_id"
            defaultValue={params.tenant_id ?? ""}
            className="w-48 rounded border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenant_id} value={tenant.tenant_id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          Status
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="w-40 rounded border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">Any status</option>
            {["uploaded", "processing", "ready", "failed", "superseded"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-[#1C1C1C] px-3 py-1.5 text-sm text-white hover:bg-black"
        >
          Filter
        </button>
        <Link
          href="/admin/documents"
          className="px-2 py-1.5 text-sm text-neutral-500 underline-offset-4 hover:underline"
        >
          Clear
        </Link>
      </form>

      {documents.length === 0 ? (
        <Empty>No documents match that filter.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Document</Th>
              <Th>Tenant</Th>
              <Th>Status</Th>
              <Th right>Pages</Th>
              <Th right>Chunks</Th>
              <Th>Uploaded</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.document_id} className="hover:bg-neutral-50">
                <Td>
                  <div className="font-medium">{document.title}</div>
                  <div className="text-xs text-neutral-500">{document.doc_type}</div>
                  {/* The actual error, not a category. M3's acceptance
                      criterion was that a corrupt file fails with something a
                      person can act on, and hiding it here would undo that. */}
                  {document.job_error ? (
                    <p className="mt-1 max-w-xl rounded bg-red-50 px-2 py-1 text-xs text-red-800">
                      {document.job_stage ? <strong>{document.job_stage}: </strong> : null}
                      {document.job_error}
                    </p>
                  ) : null}
                </Td>
                <Td muted>{document.tenant_name}</Td>
                <Td>
                  <StatusPill status={document.status} />
                  {document.attempts > 1 ? (
                    <div className="mt-1 text-xs text-neutral-500">
                      {count(document.attempts)} attempts
                    </div>
                  ) : null}
                </Td>
                <Td right muted>
                  {document.page_count === null ? "—" : count(document.page_count)}
                </Td>
                <Td right muted>
                  {count(document.chunk_count)}
                </Td>
                <Td muted>{when(document.created_at)}</Td>
                <Td right>
                  <ReprocessButton documentId={document.document_id} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminShell>
  );
}
