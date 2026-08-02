import Link from "next/link";

import { ImpersonateButton } from "@/components/admin/ImpersonateButton";
import { AdminShell, StatusPill, Table, Td, Th } from "@/components/admin/Shell";
import {
  adminFetch,
  count,
  rupees,
  when,
  type AdminDocument,
  type QuestionRow,
  type TenantSummary,
} from "@/lib/admin";

/**
 * One tenant (`UPDATE.md` §11): who they are, what they have, what they asked,
 * and the impersonate button.
 */

type Detail = {
  tenant: TenantSummary;
  members: {
    user_id: string;
    email: string;
    display_name: string | null;
    role: string;
    property_scope: string;
    email_verified: boolean;
    joined_at: string;
  }[];
  properties: {
    property_id: string;
    name: string;
    address: string | null;
    timezone: string;
    rooms_total: number;
    segment: string | null;
    status: string;
  }[];
  questions: QuestionRow[];
  documents: AdminDocument[];
};

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminFetch<Detail>(`/v1/admin/tenants/${id}`);
  const { tenant } = data;

  return (
    <AdminShell
      title={tenant.name}
      description={`${tenant.slug} · ${tenant.status} · joined ${when(tenant.created_at)} · last active ${when(tenant.last_active_at)}`}
      actions={<ImpersonateButton tenantId={tenant.tenant_id} tenantName={tenant.name} />}
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Members", value: tenant.member_count },
          { label: "Properties", value: tenant.property_count },
          { label: "Documents", value: tenant.document_count },
          { label: "Questions", value: tenant.question_count },
        ].map((stat) => (
          <div key={stat.label} className="rounded border border-neutral-200 px-3 py-2">
            <div className="text-xs text-neutral-500">{stat.label}</div>
            <div className="text-xl font-semibold tabular-nums">{count(stat.value)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Members
          </h2>
          <Table>
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Scope</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((member) => (
                <tr key={member.user_id}>
                  <Td>
                    {member.email}
                    {/* An unverified owner is the single most common reason a
                        tenant looks dead: they never clicked the link. */}
                    {member.email_verified ? null : (
                      <span className="ml-1 text-xs text-amber-700">unverified</span>
                    )}
                  </Td>
                  <Td muted>{member.role}</Td>
                  <Td muted>{member.property_scope}</Td>
                  <Td muted>{when(member.joined_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Properties
          </h2>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th right>Rooms</Th>
                <Th>Segment</Th>
                <Th>Timezone</Th>
              </tr>
            </thead>
            <tbody>
              {data.properties.map((property) => (
                <tr key={property.property_id}>
                  <Td>{property.name}</Td>
                  <Td right muted>
                    {count(property.rooms_total)}
                  </Td>
                  <Td muted>{property.segment ?? "—"}</Td>
                  <Td muted>{property.timezone}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Recent questions
          </h2>
          <Link
            href={`/admin/questions?tenant_id=${tenant.tenant_id}`}
            className="text-sm underline-offset-4 hover:underline"
          >
            All {count(tenant.question_count)} →
          </Link>
        </div>
        {data.questions.length === 0 ? (
          <p className="text-sm text-neutral-500">Nobody here has asked anything yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Asked</Th>
                <Th>Question</Th>
                <Th>Status</Th>
                <Th right>Cost</Th>
              </tr>
            </thead>
            <tbody>
              {data.questions.map((row) => (
                <tr key={row.turn_id} className="hover:bg-neutral-50">
                  <Td muted>{when(row.asked_at)}</Td>
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
                    {rupees(row.cost_inr)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Documents
          </h2>
          <Link
            href={`/admin/documents?tenant_id=${tenant.tenant_id}`}
            className="text-sm underline-offset-4 hover:underline"
          >
            All {count(tenant.document_count)} →
          </Link>
        </div>
        {data.documents.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing uploaded yet.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th right>Chunks</Th>
                <Th>Uploaded</Th>
              </tr>
            </thead>
            <tbody>
              {data.documents.map((document) => (
                <tr key={document.document_id}>
                  <Td>
                    {document.title}
                    {document.job_error ? (
                      <p className="mt-1 text-xs text-red-700">{document.job_error}</p>
                    ) : null}
                  </Td>
                  <Td>
                    <StatusPill status={document.status} />
                  </Td>
                  <Td right muted>
                    {count(document.chunk_count)}
                  </Td>
                  <Td muted>{when(document.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </AdminShell>
  );
}
