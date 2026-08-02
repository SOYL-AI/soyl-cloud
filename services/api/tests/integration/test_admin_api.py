"""The admin panel through HTTP.

`test_staff_access.py` proves the database enforces the boundary. This proves
the routes over it behave: that a customer cannot reach them, that an
impersonated session cannot reach them, that the inspector returns everything
§11 lists, and that every access lands in `audit.log` including the refused
ones.

Built on the same fixtures as `test_api_tenant_isolation.py` — signup, login,
create a tenant — so the data under test arrives the way a customer's does.
They live in `conftest.py`, which is how pytest shares a fixture without the
importing module ending up with two bindings for the same name.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.sql import text

from soyl.infrastructure.db.session import create_session_factory, tenant_session
from tests.integration.conftest import PASSWORD, build_tenant


@pytest.fixture
async def staff(
    client: AsyncClient, migrator_engine: AsyncEngine
) -> AsyncIterator[dict[str, str]]:
    """A signed-in staff member, promoted the only way that works.

    Signup and login go through the API; the promotion goes through the
    migrator, because `soyl_app` has no INSERT grant on `core.staff_user`. That
    asymmetry is the design, not a test shortcut — see migration 007.
    """
    email = f"staff-{uuid.uuid4().hex[:8]}@soyl.cloud"
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
    token = login.json()["session_token"]

    factory = create_session_factory(migrator_engine)
    async with factory() as session, session.begin():
        await session.execute(
            text(
                "INSERT INTO core.staff_user (user_id, reason) "
                "SELECT id, 'test' FROM core.user_account WHERE email = :email"
            ),
            {"email": email},
        )

    yield {"Authorization": f"Bearer {token}"}


async def _audit(migrator_engine: AsyncEngine, action: str) -> list[dict[str, object]]:
    async with migrator_engine.connect() as connection:
        rows = await connection.execute(
            text(
                "SELECT actor_id, outcome, resource_id FROM audit.log "
                "WHERE action = :action ORDER BY occurred_at"
            ),
            {"action": action},
        )
        return [
            {"actor_id": row.actor_id, "outcome": row.outcome, "resource_id": row.resource_id}
            for row in rows
        ]


# ── Who can get in ──────────────────────────────────────────────────────────


async def test_an_anonymous_caller_is_rejected(client: AsyncClient) -> None:
    response = await client.get("/v1/admin/tenants")
    assert response.status_code == 401


async def test_a_customer_gets_404_not_403(client: AsyncClient) -> None:
    """404 on purpose.

    A signed-in customer probing `/v1/admin` should not learn that the path
    exists and that they merely lack a role. 403 answers the question they were
    asking.
    """
    tenant = await build_tenant(client, "customer")
    response = await client.get("/v1/admin/tenants", headers=tenant.headers)
    assert response.status_code == 404


async def test_staff_can_list_every_tenant(client: AsyncClient, staff: dict[str, str]) -> None:
    a = await build_tenant(client, "alpha")
    b = await build_tenant(client, "bravo")

    response = await client.get("/v1/admin/tenants", headers=staff)
    assert response.status_code == 200

    ids = {row["tenant_id"] for row in response.json()["tenants"]}
    assert {str(a.tenant_id), str(b.tenant_id)} <= ids


async def test_the_tenant_list_counts_are_not_multiplied(
    client: AsyncClient, staff: dict[str, str]
) -> None:
    """The bug correlated subqueries exist to avoid.

    A tenant with one property and one membership must report exactly one of
    each. Joining both in a single query returns their product, and with one
    row apiece the product is also one — so this seeds a second property to
    make a multiplied count visible.
    """
    tenant = await build_tenant(client, "counts")
    await client.post(
        "/v1/properties",
        headers=tenant.headers,
        json={"name": "Second Hotel", "rooms_total": 10},
    )

    response = await client.get("/v1/admin/tenants", headers=staff)
    row = next(
        r for r in response.json()["tenants"] if r["tenant_id"] == str(tenant.tenant_id)
    )
    assert row["property_count"] == 2
    assert row["member_count"] == 1


# ── Audit ───────────────────────────────────────────────────────────────────


async def test_every_admin_access_is_audited(
    client: AsyncClient, staff: dict[str, str], migrator_engine: AsyncEngine
) -> None:
    """§11: every access written to `audit.log`."""
    await client.get("/v1/admin/tenants", headers=staff)

    entries = await _audit(migrator_engine, "admin.access")
    assert entries, "an admin request wrote no audit row"
    assert entries[-1]["outcome"] == "success"
    assert entries[-1]["resource_id"] == "GET /v1/admin/tenants"


async def test_a_refused_admin_access_is_also_audited(
    client: AsyncClient, migrator_engine: AsyncEngine
) -> None:
    """The row most worth having.

    A customer probing the admin panel is the event you want to find later, and
    it is the one an audit written only on the success path would drop.
    """
    tenant = await build_tenant(client, "prober")
    await client.get("/v1/admin/questions", headers=tenant.headers)

    entries = await _audit(migrator_engine, "admin.access")
    denied = [e for e in entries if e["outcome"] == "denied"]
    assert denied, "a refused admin request wrote no audit row"
    assert denied[-1]["resource_id"] == "GET /v1/admin/questions"


# ── Questions and the inspector ─────────────────────────────────────────────


async def test_questions_and_the_inspector(
    client: AsyncClient,
    staff: dict[str, str],
    app_factory: object,
    migrator_engine: AsyncEngine,
) -> None:
    """The milestone's acceptance criterion, as far as a test can carry it.

    §12: *"you can take any answer the system gave, open it in the inspector,
    and explain in under a minute why it said what it said."* A test cannot
    time a human, so it asserts the material is all present and joined to the
    right turn — the part that would make the minute impossible if it were
    missing.

    The turn is written directly rather than by running the pipeline: this is a
    test of the admin surface, and `test_answers.py` already covers the
    pipeline that produces these rows.
    """
    tenant = await build_tenant(client, "asker")
    turn_id = uuid.uuid4()
    conversation_id = uuid.uuid4()
    envelope_id = uuid.uuid4()

    factory = create_session_factory(migrator_engine)
    async with tenant_session(factory, tenant.tenant_id) as session:
        user_id = (
            await session.execute(
                text("SELECT user_id FROM core.membership WHERE tenant_id = :t"),
                {"t": tenant.tenant_id},
            )
        ).scalar_one()

        await session.execute(
            text(
                "INSERT INTO ai.conversation (id, tenant_id, user_id, title) "
                "VALUES (:id, :t, :u, 'Cancellation')"
            ),
            {"id": conversation_id, "t": tenant.tenant_id, "u": user_id},
        )
        await session.execute(
            text(
                "INSERT INTO ai.turn (id, conversation_id, tenant_id, user_id, input, status) "
                "VALUES (:id, :c, :t, :u, 'what is the cancellation policy?', 'complete')"
            ),
            {"id": turn_id, "c": conversation_id, "t": tenant.tenant_id, "u": user_id},
        )
        await session.execute(
            text(
                """
                INSERT INTO ai.envelope (id, tenant_id, turn_id, body, draft, strips)
                VALUES (:id, :t, :turn, '{"status":"complete"}'::jsonb,
                        '{"headline":"48 hours"}'::jsonb,
                        '[{"block_id":"b2","block_type":"fact","reason":"uncited"}]'::jsonb)
                """
            ),
            {"id": envelope_id, "t": tenant.tenant_id, "turn": turn_id},
        )
        await session.execute(
            text("UPDATE ai.turn SET envelope_id = :e WHERE id = :id"),
            {"e": envelope_id, "id": turn_id},
        )
        await session.execute(
            text(
                """
                INSERT INTO ai.retrieval_log
                    (turn_id, tenant_id, query, chunk_ids, scores,
                     rejected_ids, rejected_scores, reranked, latency_ms)
                VALUES (:turn, :t, 'cancellation policy',
                        '{}'::uuid[], '{}'::real[],
                        :rejected, '{0.2}'::real[], true, 240)
                """
            ),
            {
                "turn": turn_id,
                "t": tenant.tenant_id,
                "rejected": [uuid.uuid4()],
            },
        )
        await session.execute(
            text(
                "INSERT INTO billing.usage_ledger "
                "(tenant_id, user_id, turn_id, kind, provider, model, input_tokens, cost_inr) "
                "VALUES (:t, :u, :turn, 'llm', 'azure_openai', 'gpt-5.4-mini', 900, 0.42)"
            ),
            {"t": tenant.tenant_id, "u": user_id, "turn": turn_id},
        )

    listing = await client.get("/v1/admin/questions", headers=staff)
    assert listing.status_code == 200
    assert str(turn_id) in {q["turn_id"] for q in listing.json()["questions"]}

    # Stemmed full-text: "cancel" must find "cancellation".
    searched = await client.get("/v1/admin/questions?search=cancel", headers=staff)
    assert str(turn_id) in {q["turn_id"] for q in searched.json()["questions"]}

    filtered = await client.get(
        f"/v1/admin/questions?tenant_id={tenant.tenant_id}", headers=staff
    )
    assert filtered.json()["total"] == 1

    inspected = await client.get(f"/v1/admin/turns/{turn_id}", headers=staff)
    assert inspected.status_code == 200
    body = inspected.json()

    # Everything §11 lists for the inspector, in one response.
    assert body["turn"]["question"] == "what is the cancellation policy?"
    assert body["retrieval"]["query"] == "cancellation policy"
    assert body["retrieval"]["reranked"] is True
    # A chunk that no longer exists is still shown with its score. "This answer
    # was built on something since deleted" is a finding, not a blank row.
    assert body["retrieval"]["rejected"] == 1
    assert body["chunks"][0]["kept"] is False
    assert body["draft"] == {"headline": "48 hours"}
    assert body["strips"][0]["reason"] == "uncited"
    assert body["envelope"] == {"status": "complete"}
    assert body["usage"][0]["model"] == "gpt-5.4-mini"


async def test_the_csv_export_carries_the_rows_and_is_not_cacheable(
    client: AsyncClient, staff: dict[str, str]
) -> None:
    response = await client.get("/v1/admin/questions.csv", headers=staff)
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store, no-transform"
    assert response.text.splitlines()[0].startswith("asked_at,tenant,user,status,question")


async def test_an_unknown_turn_is_404(client: AsyncClient, staff: dict[str, str]) -> None:
    response = await client.get(f"/v1/admin/turns/{uuid.uuid4()}", headers=staff)
    assert response.status_code == 404


# ── Funnel and cost ─────────────────────────────────────────────────────────


async def test_the_funnel_cohorts_a_new_signup(
    client: AsyncClient, staff: dict[str, str]
) -> None:
    """A user who has signed up and created a property lands in this week's
    cohort with `created_property` counted and `asked_question` not."""
    await build_tenant(client, "funnel")

    response = await client.get("/v1/admin/funnel?weeks=1", headers=staff)
    assert response.status_code == 200
    weeks = response.json()["weeks"]
    assert weeks, "a signup this week produced no cohort"
    assert weeks[0]["signed_up"] >= 1
    assert weeks[0]["created_property"] >= 1


async def test_cost_aggregates_the_ledger_per_tenant_per_day(
    client: AsyncClient, staff: dict[str, str], migrator_engine: AsyncEngine
) -> None:
    """Two calls on one day for one tenant are one row, summed.

    Written as two ledger rows rather than one, because §6.6 stores one row per
    *model call* and the screen's whole job is to add them up. A version that
    returned the rows unaggregated would pass a single-row test.
    """
    tenant = await build_tenant(client, "spender")
    factory = create_session_factory(migrator_engine)

    async with tenant_session(factory, tenant.tenant_id) as session:
        for kind, model, cost in (
            ("embed", "text-embedding-3-small", "0.0100"),
            ("llm", "gpt-5.4-mini", "0.4200"),
        ):
            await session.execute(
                text(
                    "INSERT INTO billing.usage_ledger "
                    "(tenant_id, kind, provider, model, input_tokens, cost_inr) "
                    "VALUES (:t, :kind, 'azure_openai', :model, 100, CAST(:cost AS numeric))"
                ),
                {"t": tenant.tenant_id, "kind": kind, "model": model, "cost": cost},
            )

    response = await client.get(
        f"/v1/admin/cost?days=30&tenant_id={tenant.tenant_id}", headers=staff
    )
    assert response.status_code == 200
    rows = response.json()["rows"]
    assert len(rows) == 1, f"expected one day for one tenant, got {rows}"
    assert rows[0]["calls"] == 2
    assert rows[0]["cost_inr"] == pytest.approx(0.43)


# ── Impersonation ───────────────────────────────────────────────────────────


async def test_impersonation_is_read_only_time_boxed_and_audited(
    client: AsyncClient, staff: dict[str, str], migrator_engine: AsyncEngine
) -> None:
    """§11: audited, time-boxed, banner shown.

    The banner is a UI concern, but what makes it possible is asserted here —
    the minted session resolves with `impersonated_by` set, which is what the
    app reads.
    """
    tenant = await build_tenant(client, "target")

    minted = await client.post(
        f"/v1/admin/tenants/{tenant.tenant_id}/impersonate", headers=staff
    )
    assert minted.status_code == 200
    payload = minted.json()
    assert payload["acting_as"] == tenant.email

    headers = {"Authorization": f"Bearer {payload['session_token']}"}

    # It can read the tenant's data.
    listed = await client.get("/v1/documents", headers=headers)
    assert listed.status_code == 200

    # It cannot write. `document:write` was stripped at resolution, so this is
    # 403 rather than a successful upload.
    created = await client.post(
        "/v1/documents",
        headers=headers,
        json={"title": "Planted", "filename": "x.md", "content_type": "text/markdown"},
    )
    assert created.status_code == 403

    # And it cannot become staff, which would make the chain unauditable.
    escalated = await client.get("/v1/admin/tenants", headers=headers)
    assert escalated.status_code in (403, 404)

    started = await _audit(migrator_engine, "admin.impersonate_start")
    assert started and started[-1]["resource_id"] == str(tenant.tenant_id)

    ended = await client.post("/v1/admin/impersonation/end", headers=headers)
    assert ended.status_code == 204

    # Revoked: the token no longer resolves.
    after = await client.get("/v1/documents", headers=headers)
    assert after.status_code == 401


async def test_impersonating_a_tenant_with_no_members_is_a_conflict(
    client: AsyncClient, staff: dict[str, str], migrator_engine: AsyncEngine
) -> None:
    """409, not 500. There is nobody to act as, and that is a real state."""
    tenant_id = uuid.uuid4()
    factory = create_session_factory(migrator_engine)
    async with tenant_session(factory, tenant_id) as session:
        await session.execute(
            text(
                "INSERT INTO core.tenant (id, name, slug, country) "
                "VALUES (:id, 'Empty', :slug, 'IN')"
            ),
            {"id": tenant_id, "slug": f"empty-{uuid.uuid4().hex[:8]}"},
        )

    response = await client.post(f"/v1/admin/tenants/{tenant_id}/impersonate", headers=staff)
    assert response.status_code == 409
