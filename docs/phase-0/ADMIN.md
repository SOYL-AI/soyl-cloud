# The admin panel

**Milestone:** M6 · **Built:** 2026-08-02 · **Scope:** `UPDATE.md` §11, all six screens

Internal only, behind a `soyl_staff` role, every access written to `audit.log`.
Ugly is fine; useful is mandatory.

---

## Getting in

Staff membership is granted by a script that runs as `soyl_migrator`, because
`soyl_app` holds `SELECT` on `core.staff_user` and nothing else. That is the
point: **no bug in the API can promote anyone**, and there is deliberately no
screen that does it.

```bash
cd services/api
export SOYL_DATABASE_URL_MIGRATOR="postgresql://soyl_migrator:...@host:5432/soyl"

uv run python scripts/grant_staff.py grant  founder@soyl.cloud "the founder"
uv run python scripts/grant_staff.py list
uv run python scripts/grant_staff.py revoke someone@soyl.cloud
```

The account has to exist first — sign up through the site, then grant. Revoking
sets `revoked_at` rather than deleting, so "who had access in March" stays
answerable, and it takes effect on the **next statement**: staff access does not
go through the claims cache.

Then sign in normally and open `/admin`.

---

## The six screens

| Route | What it answers |
|---|---|
| `/admin` | Who is using this, and who has gone quiet |
| `/admin/tenants/[id]` | Everything about one customer, plus impersonate |
| `/admin/questions` | Every question ever asked, filtered, exportable |
| `/admin/turns/[id]` | **Why did it say that** |
| `/admin/documents` | What failed ingestion, with the actual error, and a retry |
| `/admin/funnel` | Signup cohorts, week by week |
| `/admin/cost` | Spend per tenant per day |

### The answer inspector is the one that matters

§12's acceptance criterion is that you can open any answer and explain in under
a minute why it said what it said. The page is built backwards from that
sentence:

1. **A verdict in words, first.** Not JSON. The screen states a conclusion and
   puts the evidence under it, because a page that opens with a payload makes
   the reader do the diagnosis — which is the minute we are trying not to
   spend. `verdict()` in `src/lib/admin-types.ts`, tested in `admin.test.mts`.
2. **Rejected chunks beside kept ones,** with scores. "We found it and scored
   it 0.20" and "we never found it" are different bugs with different fixes,
   and from outside both are an empty answer.
3. **Draft → strips → envelope,** in that order. What the model said, what the
   validator removed, what the customer saw. Read top to bottom, it is the
   causal chain.

Worked example, from a real turn:

> **Retrieval found 8 passages and the reranker rejected all of them.**
> The best rejected score was 0.200. If the right passage is in the rejected
> list below, this is a reranking problem. If it is not, it is a retrieval
> problem.

That is the whole diagnosis, before scrolling.

---

## How staff read across tenants

This is the part worth understanding before changing anything.

Every tenant-scoped table is under `ENABLE` **and** `FORCE` row level security
with a policy keyed on `app.tenant_id`. §11's questions, funnel and cost screens
are cross-tenant aggregates by definition, so M6 had to answer a question the
first six migrations were built to make hard.

**It is not `BYPASSRLS`.** That would work and would move the enforcement point
out of Postgres into "the admin query remembered to filter" — the retrofit §6.1
exists to prevent. A missing `WHERE` would then be a leak rather than an empty
page.

Instead, migration 007 adds a second policy to every table that has
`tenant_isolation`:

```sql
CREATE POLICY staff_read ON <table> FOR SELECT USING (core.is_staff());
```

Postgres OR's permissive policies together, so this widens `SELECT` without
touching the existing policy. Four properties follow, and each has a test in
`tests/integration/test_staff_access.py`:

- **Read-only.** `FOR SELECT` only, so `tenant_isolation` remains the sole
  policy governing INSERT, UPDATE and DELETE. With no `app.tenant_id` set it
  matches nothing — so a staff UPDATE is not refused, it affects *zero rows*.
  That quieter failure is what the test asserts on.
- **Not forgeable.** `core.is_staff()` resolves `app.staff_id` against
  `core.staff_user`. An arbitrary uuid — or a real customer's own user id —
  reads exactly as much as no setting at all: nothing.
- **Revocable in one write,** everywhere, immediately.
- **Not grantable by the application.** See above.

`core.staff_user` is the one table in the database with `ENABLE` and no `FORCE`,
and `DECISION-LOG.md` records why: under FORCE its only policy is `FOR SELECT`,
so nobody at all can insert — including the migrator — and `grant_staff.py`
fails. The first version of the migration did exactly that and the isolation
suite caught it.

### The one thing that writes

Reprocessing a document runs on a **tenant** session, not a staff one, because
a staff session satisfies no `tenant_isolation` policy and the write would
affect zero rows and report success. Doing it as the tenant is not a workaround
— it means the job is indistinguishable from one the customer started.

---

## Impersonation

Audited, time-boxed, read-only, banner shown.

- **Minting** creates a `core.session` row with `impersonated_by` set to the
  staff user, expiring in 30 minutes, acting as the tenant's longest-standing
  owner. Deterministic on purpose: two people reproducing the same report must
  see the same data.
- **Read-only** is applied in `PrincipalResolver` via `Principal.read_only()`,
  which strips every `:write` scope — one line in one place, so no route has to
  remember. The *tenant* boundary is RLS and holds regardless.
- **The banner** lives in `src/app/app/layout.tsx` rather than in
  `WorkspaceShell`, so a route added later that forgets the shell still shows
  it. It is not dismissible.
- **It cannot escalate.** An impersonated session is refused at `/v1/admin`, so
  it cannot mint a further impersonation with no trail back to who started it.
- **Ending it revokes the row**, not just the cookie. Deleting only the cookie
  would leave a live token replayable for the rest of its thirty minutes.

Both ends are in `audit.log` as `admin.impersonate_start` and
`admin.impersonate_end`.

---

## What every admin request writes

One row per request, including the refused ones, from the dependency rather
than from each route — a second way to reach admin data is how one of them ends
up unaudited.

```
action        admin.access | admin.impersonate_start | admin.impersonate_end
              | admin.document_reprocess
outcome       success | denied
actor_id      the staff user
resource_id   "GET /v1/admin/questions"
after         {"query": "tenant_id=…&search=cancel"}
tenant_id     null
```

`tenant_id` is null and that is correct rather than a gap: a staff read is not
an event in any one tenant's history, and `audit.log`'s policy would refuse a
tenant id from a session holding no tenant context. *Which* tenant was being
looked at is in the query string, which is recorded.

The audit row is written on **its own transaction**. If it shared the request's,
an admin request that 500s would roll back the record that it happened — and
the accesses most worth having recorded are the ones that went wrong.

---

## Known limits

- **The funnel's later columns are *ever*, not *that week*.** A user who signed
  up in July and uploaded in August counts in July's row. That is what makes it
  a cohort; it also means the most recent row always looks worst because it has
  had the least time. Stated on the screen.
- **`returned_week_two` is a habit signal, not a value one.** Someone can
  return and still get nothing useful. The questions screen is where you find
  out which.
- **Question search is stemmed, not substring.** `cancel` finds "cancellation";
  `ancel` finds nothing.
- **Cost before 2026-08-02 reads as ₹0** for anything the answer pipeline did.
  The ledger recorded tokens and not money until the bug in
  `DECISION-LOG.md` was fixed; ingestion rows are correct throughout. Token
  counts for that period are real and can be repriced if it ever matters.
