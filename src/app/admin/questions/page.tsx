import Link from "next/link";

import { AdminShell, Empty, StatusPill, Table, Td, Th } from "@/components/admin/Shell";
import {
  adminFetch,
  count,
  rupees,
  when,
  type QuestionRow,
  type TenantSummary,
} from "@/lib/admin";

/**
 * Questions — "the screen you will use most" (`UPDATE.md` §11).
 *
 * Filters live in the URL rather than in component state, so a filtered view
 * can be sent to someone. That is most of what makes an internal tool useful:
 * the alternative is describing which dropdowns to set.
 *
 * The form is a plain GET form with no `"use client"` anywhere on this page.
 * A form that navigates is exactly what a filter is, and the browser has done
 * it correctly since before any of this existed.
 */

type Search = {
  tenant_id?: string;
  status?: string;
  search?: string;
  since?: string;
  until?: string;
  page?: string;
};

const STATUSES = ["complete", "no_evidence", "refused", "failed", "running"];

function query(params: Search): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [{ questions, total, page_size }, { tenants }] = await Promise.all([
    adminFetch<{ questions: QuestionRow[]; total: number; page_size: number }>(
      `/v1/admin/questions${query({ ...params, page: String(page) })}`,
    ),
    adminFetch<{ tenants: TenantSummary[] }>("/v1/admin/tenants"),
  ]);

  const pages = Math.max(1, Math.ceil(total / page_size));
  // The export honours the current filter, which is the only version of an
  // export button worth having.
  const csv = `/api/admin/questions.csv${query({ ...params, page: undefined })}`;

  return (
    <AdminShell
      title="Questions"
      description="Every question ever asked, including the ones we could not answer. Those are the roadmap."
      actions={
        <a
          href={csv}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Export CSV
        </a>
      }
    >
      <form method="GET" className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          Search
          <input
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="cancellation"
            className="w-56 rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>

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
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          From
          <input
            type="date"
            name="since"
            defaultValue={params.since ?? ""}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          To
          <input
            type="date"
            name="until"
            defaultValue={params.until ?? ""}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>

        <button
          type="submit"
          className="rounded bg-[#1C1C1C] px-3 py-1.5 text-sm text-white hover:bg-black"
        >
          Filter
        </button>
        <Link
          href="/admin/questions"
          className="px-2 py-1.5 text-sm text-neutral-500 underline-offset-4 hover:underline"
        >
          Clear
        </Link>
      </form>

      <p className="mb-2 text-sm text-neutral-600">
        {count(total)} {total === 1 ? "question" : "questions"}
        {params.search ? (
          <>
            {" "}
            matching <strong>{params.search}</strong>
          </>
        ) : null}
      </p>

      {questions.length === 0 ? (
        <Empty>
          Nothing matches that filter.{" "}
          {params.search ? "Search is stemmed, not substring — try a whole word." : null}
        </Empty>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Asked</Th>
                <Th>Tenant</Th>
                <Th>Question</Th>
                <Th>Status</Th>
                <Th right>Latency</Th>
                <Th right>Cost</Th>
              </tr>
            </thead>
            <tbody>
              {questions.map((row) => (
                <tr key={row.turn_id} className="hover:bg-neutral-50">
                  <Td muted>{when(row.asked_at)}</Td>
                  <Td>
                    <div>{row.tenant_name}</div>
                    <div className="text-xs text-neutral-500">{row.user_email ?? "—"}</div>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/turns/${row.turn_id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.question}
                    </Link>
                  </Td>
                  <Td>
                    <StatusPill status={row.status} />
                  </Td>
                  <Td right muted>
                    {row.latency_ms === null ? "—" : `${count(row.latency_ms)}ms`}
                  </Td>
                  <Td right muted>
                    {rupees(row.cost_inr)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {pages > 1 ? (
            <nav className="mt-3 flex items-center gap-3 text-sm">
              {page > 1 ? (
                <Link
                  href={`/admin/questions${query({ ...params, page: String(page - 1) })}`}
                  className="underline-offset-4 hover:underline"
                >
                  ← Previous
                </Link>
              ) : null}
              <span className="text-neutral-500">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link
                  href={`/admin/questions${query({ ...params, page: String(page + 1) })}`}
                  className="underline-offset-4 hover:underline"
                >
                  Next →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </AdminShell>
  );
}
