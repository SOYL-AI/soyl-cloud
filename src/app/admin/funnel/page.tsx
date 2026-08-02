import { AdminShell, Empty, Table, Td, Th } from "@/components/admin/Shell";
import { adminFetch, count, type FunnelWeek } from "@/lib/admin";

/**
 * Funnel (`UPDATE.md` §11), cohorted by signup week.
 *
 * Each row is a cohort, not a week's activity. "Six people uploaded a document
 * this week" mixes six different cohorts and cannot say whether onboarding is
 * getting better; "of the eleven who signed up in week 30, six eventually
 * uploaded" can. Which means the later columns are *ever*, not *that week*,
 * and the percentages compare against that row's own signups.
 *
 * A young cohort will always look worse than an old one, because it has had
 * less time. That is stated on the screen rather than left to be rediscovered.
 */

const STEPS = [
  { key: "verified", label: "Verified email" },
  { key: "created_property", label: "Created a property" },
  { key: "uploaded_document", label: "Uploaded a document" },
  { key: "asked_question", label: "Asked a question" },
  { key: "returned_week_two", label: "Returned in week 2" },
] as const;

function share(value: number, of: number): string {
  if (of === 0) return "—";
  return `${Math.round((value / of) * 100)}%`;
}

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ weeks?: string }>;
}) {
  const params = await searchParams;
  const weeks = Math.min(52, Math.max(1, Number(params.weeks ?? "8") || 8));
  const data = await adminFetch<{ weeks: FunnelWeek[] }>(`/v1/admin/funnel?weeks=${weeks}`);

  const totals = data.weeks.reduce(
    (sum, week) => ({
      signed_up: sum.signed_up + week.signed_up,
      verified: sum.verified + week.verified,
      created_property: sum.created_property + week.created_property,
      uploaded_document: sum.uploaded_document + week.uploaded_document,
      asked_question: sum.asked_question + week.asked_question,
      returned_week_two: sum.returned_week_two + week.returned_week_two,
    }),
    {
      signed_up: 0,
      verified: 0,
      created_property: 0,
      uploaded_document: 0,
      asked_question: 0,
      returned_week_two: 0,
    },
  );

  return (
    <AdminShell
      title="Funnel"
      description="Signup cohorts. Each row follows the people who signed up that week, however long they took to get to the next step — so the most recent row is always the least complete."
      actions={
        <form method="GET" className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-neutral-600">
            Weeks
            <input
              type="number"
              name="weeks"
              min={1}
              max={52}
              defaultValue={weeks}
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
      {data.weeks.length === 0 ? (
        <Empty>Nobody has signed up in the last {weeks} weeks.</Empty>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Cohort</Th>
                <Th right>Signed up</Th>
                {STEPS.map((step) => (
                  <Th key={step.key} right>
                    {step.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.weeks.map((week) => (
                <tr key={week.week} className="hover:bg-neutral-50">
                  <Td>
                    {new Date(week.week).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Td>
                  <Td right>{count(week.signed_up)}</Td>
                  {STEPS.map((step) => (
                    <Td key={step.key} right>
                      {count(week[step.key])}
                      <span className="ml-1 text-xs text-neutral-500">
                        {share(week[step.key], week.signed_up)}
                      </span>
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-50 font-medium">
                <Td>All {count(data.weeks.length)} cohorts</Td>
                <Td right>{count(totals.signed_up)}</Td>
                {STEPS.map((step) => (
                  <Td key={step.key} right>
                    {count(totals[step.key])}
                    <span className="ml-1 text-xs font-normal text-neutral-500">
                      {share(totals[step.key], totals.signed_up)}
                    </span>
                  </Td>
                ))}
              </tr>
            </tfoot>
          </Table>

          <p className="mt-3 max-w-3xl text-xs text-neutral-500">
            &ldquo;Returned in week 2&rdquo; is a session seen between 7 and 14 days after signup.
            It is a habit signal, not a value one — someone can return and still get nothing
            useful. The questions screen is where you find out which.
          </p>
        </>
      )}
    </AdminShell>
  );
}
