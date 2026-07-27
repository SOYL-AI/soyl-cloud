-- The two roles the whole tenancy model rests on.
--
-- soyl_migrator  owns every schema and table. Alembic connects as this.
-- soyl_app       connects from the API. Owns nothing. No BYPASSRLS.
--
-- Neither role has BYPASSRLS, and that is deliberate — see
-- docs/phase-0/DECISION-LOG.md. The handbook (§48.7) says migrations run as a
-- role *with* BYPASSRLS, but granting BYPASSRLS requires superuser, which
-- managed providers generally do not hand over. A migration that needs to
-- touch tenant rows toggles FORCE off inside its own transaction instead,
-- which the table owner may do without any special role attribute. That keeps
-- migration 001 portable to Neon, Supabase and Railway alike.
--
-- Passwords here are local-development literals and are meant to be visible.
-- Production credentials come from the platform's secret store and never from
-- a file in this repository.

CREATE ROLE soyl_migrator LOGIN PASSWORD 'soyl_migrator_local'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT;

CREATE ROLE soyl_app LOGIN PASSWORD 'soyl_app_local'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT;

-- soyl_app must not be able to reach the tables by becoming their owner.
-- Postgres does not grant this implicitly, but a provider's provisioning
-- might, so the isolation suite asserts it is absent rather than trusting it.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO soyl_migrator, soyl_app;

-- Only the migrator creates objects. An app role that can CREATE TABLE can
-- create one without a policy on it.
GRANT CREATE ON SCHEMA public TO soyl_migrator;

-- Database-level grants, against whatever the database is called. Locally that
-- is `soyl`; on Railway it is `railway`, and a managed provider rarely lets you
-- choose. Hardcoding the name made this file local-only, which defeated the
-- point of running the same SQL everywhere.
DO $$
BEGIN
    -- Connecting is not enough to read anything; every table grant is explicit
    -- and lives in the migration that creates the table.
    EXECUTE format(
        'GRANT CONNECT ON DATABASE %I TO soyl_migrator, soyl_app', current_database()
    );
    -- Migration 001 creates the `core` schema, which needs CREATE on the
    -- database. soyl_app is pointedly not granted this: a role that can create
    -- a schema can create a table in it without a policy.
    EXECUTE format('GRANT CREATE ON DATABASE %I TO soyl_migrator', current_database());
END
$$;
