import Link from "next/link";

import { AdminShell, Empty, Table, Td, Th } from "@/components/admin/Shell";
import { adminFetch, count, rupees, type CostRow, type TenantSummary } from "@/lib/admin";

/**
 * Cost — spend per tenant per day, from the usage ledger (`UPDATE.md` §11).
 *
 * From `billing.usage_ledger`, which holds one row per *model call*, not from
 * the denormalised total on `ai.turn`. The distinction is the whole point:
 * only the ledger can say whether the money went on embedding, reranking or
 * synthesis, and "this tenant is expensive" is not actionable until you know
 * which.
 *
 * The per-tenant totals are computed here rather than in a second query. The
 * page already has every row it needs to add up, and a second aggregate is a
 * second chance for the two numbers to disagree.
 */

export default async function CostPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; tenant_id?: string }>;
}) {
  const params = await searchParams;
  const days = Math.min(365, Math.max(1, Number(params.days ?? "30") || 30));
  const search = new URLSearchParams({ days: String(days) });
  if (params.tenant_id) search.set("tenant_id", params.tenant_id);

  const [{ rows }, { tenants }] = await Promise.all([
    adminFetch<{ rows: CostRow[] }>(`/v1/admin/cost?${search}`),
    adminFetch<{ tenants: TenantSummary[] }>("/v1/admin/tenants"),
  ]);

  const total = rows.reduce((sum, row) => sum + row.cost_inr, 0);

  const byTenant = new Map<string, { name: string; cost: number; calls: number }>();
  for (const row of rows) {
    const entry = byTenant.get(row.tenant_id) ?? { name: row.tenant_name, cost: 0, calls: 0 };
    entry.cost += row.cost_inr;
    entry.calls += row.calls;
    byTenant.set(row.tenant_id, entry);
  }
  const ranked = [...byTenant.entries()].sort((a, b) => b[1].cost - a[1].cost);

  return (
    <AdminShell
      title="Cost"
      description={`${rupees(total)} across ${count(rows.length)} tenant-days in the last ${days} days.`}
      actions={
        <form method="GET" className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-neutral-600">
            Tenant
            <select
              name="tenant_id"
              defaultValue={params.tenant_id ?? ""}
              className="w-44 rounded border border-neutral-300 px-2 py-1.5 text-sm"
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
            Days
            <input
              type="number"
              name="days"
              min={1}
              max={365}
              defaultValue={days}
              className="w-20 rounded border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Apply
          </button>
        </form>
      }
    >
      {rows.length === 0 ? (
        <Empty>No model calls have been billed in that window.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Per tenant, per day
            </h2>
            <Table>
              <thead>
                <tr>
                  <Th>Day</Th>
                  <Th>Tenant</Th>
                  <Th right>Calls</Th>
                  <Th right>Tokens</Th>
                  <Th right>Cost</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.day}-${row.tenant_id}`} className="hover:bg-neutral-50">
                    <Td muted>
                      {new Date(row.day).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/tenants/${row.tenant_id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {row.tenant_name}
                      </Link>
                    </Td>
                    <Td right muted>
                      {count(row.calls)}
                    </Td>
                    <Td right muted>
                      {count(row.input_tokens + row.output_tokens)}
                    </Td>
                    <Td right>{rupees(row.cost_inr)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Most expensive
            </h2>
            <Table>
              <thead>
                <tr>
                  <Th>Tenant</Th>
                  <Th right>Calls</Th>
                  <Th right>Cost</Th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(([tenantId, entry]) => (
                  <tr key={tenantId}>
                    <Td>
                      <Link
                        href={`/admin/cost?days=${days}&tenant_id=${tenantId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {entry.name}
                      </Link>
                    </Td>
                    <Td right muted>
                      {count(entry.calls)}
                    </Td>
                    <Td right>{rupees(entry.cost)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
