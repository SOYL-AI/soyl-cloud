# Managed Postgres — does the provider actually let us do RLS properly?

**Status: not yet run against a real instance.** I have no provider credentials in this environment and creating trial accounts is your call, not mine. What follows is the check itself, so it costs about fifteen minutes per provider rather than an afternoon.

`UPDATE.md` §6.1 requires two things a lot of managed Postgres does not give you:

1. An **application role without `BYPASSRLS`**. If the app connects as a role that bypasses RLS, migration 001's policies are decoration and the tenant isolation suite passes while proving nothing.
2. A **separate migration role** that owns the tables. Table owners bypass RLS unless `FORCE ROW LEVEL SECURITY` is set — so owner and app must be different roles, and the app role must not be a member of the owner role.

Providers that hand over a single near-superuser connection and no `CREATEROLE` cannot satisfy either. **Do not accept the documentation's answer** — several providers document `CREATEROLE` and then restrict what the created role may do, or silently grant the new role membership of the owner.

## The check

Run as the admin user the provider gives you, against a throwaway database on a **trial instance of the real product** — not a local container, not their free-tier emulator if it differs.

```sql
-- 1. Can we create roles at all?
CREATE ROLE soyl_migrator LOGIN PASSWORD 'throwaway-1';
CREATE ROLE soyl_app      LOGIN PASSWORD 'throwaway-2';

-- 2. Neither may bypass RLS. If the provider forces this on, stop here.
SELECT rolname, rolsuper, rolbypassrls, rolcreaterole
FROM pg_roles WHERE rolname IN ('soyl_migrator', 'soyl_app');
-- Required: rolsuper = f, rolbypassrls = f for BOTH.

-- 3. The app role must not inherit the migrator's ownership.
SELECT r.rolname AS member, g.rolname AS granted
FROM pg_auth_members m
JOIN pg_roles r ON r.oid = m.member
JOIN pg_roles g ON g.oid = m.roleid
WHERE r.rolname IN ('soyl_migrator', 'soyl_app');
-- Required: no row granting soyl_app membership of soyl_migrator (or of the
-- provider's admin role). Some providers add this automatically.

-- 4. Build the real thing as the migrator.
\c - soyl_migrator
CREATE SCHEMA core;
CREATE TABLE core.thing (
  id        bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL,
  label     text NOT NULL
);
ALTER TABLE core.thing ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.thing FORCE  ROW LEVEL SECURITY;  -- applies to the owner too
CREATE POLICY tenant_isolation ON core.thing
  USING (tenant_id = current_setting('app.tenant_id', TRUE)::uuid);
GRANT USAGE ON SCHEMA core TO soyl_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.thing TO soyl_app;

INSERT INTO core.thing (tenant_id, label) VALUES
  ('11111111-1111-1111-1111-111111111111', 'tenant A row'),
  ('22222222-2222-2222-2222-222222222222', 'tenant B row');

-- 5. The moment of truth, as the app role.
\c - soyl_app
SET app.tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) FROM core.thing;              -- must be 1
RESET app.tenant_id;
SELECT count(*) FROM core.thing;              -- must be 0, NOT an error and NOT 2
SET app.tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT count(*) FROM core.thing;              -- must be 1, and must be tenant B's

-- 6. The app role must not be able to switch itself out of the policy.
ALTER TABLE core.thing DISABLE ROW LEVEL SECURITY;  -- must FAIL
SET ROLE soyl_migrator;                             -- must FAIL
```

### Pass criteria

| # | Requirement |
|---|---|
| 1 | Both roles are created, `rolsuper = f` and `rolbypassrls = f` on both |
| 2 | `soyl_app` holds no membership of `soyl_migrator` or of the provider's admin role |
| 3 | With `app.tenant_id` set, the app role sees exactly that tenant's rows |
| 4 | With it unset, the app role sees **zero** rows — a missing setting must fail closed |
| 5 | `FORCE ROW LEVEL SECURITY` is honoured — the owner is also filtered |
| 6 | The app role cannot disable RLS or `SET ROLE` to the owner |
| 7 | The connection **pooler** passes `SET`/`set_config` through per transaction — check this on the pooled port, not just the direct one |

Criterion 7 is the one that bites. A transaction-mode pooler that multiplexes sessions can leak `app.tenant_id` between tenants or drop it entirely. Test on the exact connection string the app will use, and prefer `set_config('app.tenant_id', $1, true)` — transaction-scoped — over a session `SET`.

## Providers worth testing, in the order I would test them

Bengaluru-based, so region matters as much as role support: `ap-south-1` (Mumbai) or Singapore, otherwise every query pays 150 ms.

1. **Neon** — branching is genuinely useful for the tenant isolation suite in CI.
2. **Supabase** — RLS is its native idiom, which is a good sign, but check what `postgres` is granted and what the pooler does.
3. **Railway** — the rest of Phase 0 deploys there, so one vendor is worth something. Verify it is a real managed Postgres and not a container with a volume.
4. **Crunchy Bridge / RDS** — the fallback if the others fail; both give real superuser, both cost more.

Record the result per provider in this file when you run it, and put the winner's decision in `DECISION-LOG.md`. **M1's migration 001 depends on the answer** — if no provider passes, migration 001 changes shape, and it is much cheaper to know that before it is written than after.
