import Link from "next/link";

import { AdminShell, Empty, Table, Td, Th } from "@/components/admin/Shell";
import { adminFetch, count, when, type TenantSummary } from "@/lib/admin";

/**
 * Tenants (`UPDATE.md` §11).
 *
 * Ordered by last activity rather than by name, because the question this
 * screen answers is "who is using this" and an alphabetical list buries it.
 */

export default async function TenantsPage() {
  const { tenants } = await adminFetch<{ tenants: TenantSummary[] }>("/v1/admin/tenants");

  return (
    <AdminShell
      title="Tenants"
      description={`${count(tenants.length)} ${tenants.length === 1 ? "tenant" : "tenants"}, most recently active first.`}
    >
      {tenants.length === 0 ? (
        <Empty>No tenants yet.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tenant</Th>
              <Th right>Members</Th>
              <Th right>Properties</Th>
              <Th right>Documents</Th>
              <Th right>Questions</Th>
              <Th>Last active</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.tenant_id} className="hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`/admin/tenants/${tenant.tenant_id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {tenant.name}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {tenant.slug}
                    {tenant.status !== "active" ? ` · ${tenant.status}` : ""}
                  </div>
                </Td>
                <Td right>{count(tenant.member_count)}</Td>
                <Td right>{count(tenant.property_count)}</Td>
                <Td right>{count(tenant.document_count)}</Td>
                <Td right>{count(tenant.question_count)}</Td>
                <Td muted>{when(tenant.last_active_at)}</Td>
                <Td muted>{when(tenant.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminShell>
  );
}
