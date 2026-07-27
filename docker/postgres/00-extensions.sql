-- Extensions must be installed by a superuser: neither `vector` nor `citext`
-- is a trusted extension, so `soyl_migrator` cannot create them itself. This
-- is a provider capability, not something migration 001 can assume — see
-- docs/phase-0/POSTGRES-PROVIDER-CHECK.md.
--
-- Runs once, against POSTGRES_DB, as the superuser.

-- core.user_account.email is citext: case-insensitive uniqueness enforced by
-- the type rather than by lower() indexes everywhere.
CREATE EXTENSION IF NOT EXISTS citext;

-- Not used until M3. Installed now so that "can this provider give us
-- pgvector" is answered while it is a question and not a blocker.
CREATE EXTENSION IF NOT EXISTS vector;

-- gen_random_uuid() is built into Postgres 13+; pgcrypto is deliberately not
-- installed. Password hashing is Argon2id in the application (UPDATE.md §5),
-- never in the database.
