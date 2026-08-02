"""The admin panel's API (`UPDATE.md` §11).

Every route hangs off `StaffReq`, which authenticates, authorises and audits in
one place. None of them takes a tenant from the caller's session, because a
staff session has none — a `tenant_id` here is a filter the operator chose, not
an identity they hold.

`UPDATE.md` §11 opens with "Ugly is fine. Useful is mandatory." That is a
licence about the UI, not about the queries: the answer inspector is the
debugger for a probabilistic system and is the reason this milestone exists.

Read-only except for two routes, and both are deliberate about it:

- **reprocess** re-runs ingestion, and has to switch to a *tenant* session to
  do it. A staff session satisfies no `tenant_isolation` policy, so the write
  would affect zero rows and report success. Doing it as the tenant is not a
  workaround; it is the only correct way, and it means the job is
  indistinguishable from one the customer started, which is what we want.
- **impersonate** mints a session. Time-boxed to 30 minutes, read-only by
  scope, flagged so the app can show a banner, and audited at both ends.
"""

from __future__ import annotations

import csv
import io
import uuid
from datetime import UTC, datetime
from typing import Annotated, Any

from arq import create_pool
from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from soyl.infrastructure.db.repositories import audit_repository as audit_actions
from soyl.infrastructure.db.repositories.admin_repository import (
    PAGE_SIZE,
    AdminRepository,
)
from soyl.infrastructure.db.repositories.audit_repository import AuditRepository
from soyl.infrastructure.db.repositories.document_repository import (
    IngestionJobRepository,
)
from soyl.infrastructure.db.repositories.identity_repository import SessionRepository
from soyl.infrastructure.db.repositories.staff_repository import StaffRepository
from soyl.infrastructure.db.session import tenant_session, untenanted_session
from soyl.infrastructure.queue.connection import redis_settings
from soyl.interface.http.authenticated import bearer_token
from soyl.interface.http.deps import get_session_factory
from soyl.interface.http.staff import StaffReq, client_ip

router = APIRouter(prefix="/v1/admin", tags=["admin"])

Factory = Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)]

# Reprocessing puts the document back into the state a fresh upload leaves it
# in, so the UI stops showing the old failure while the retry is in flight. The
# `checksum` and `blob_uri` are untouched: the bytes did not change, and this is
# a retry of the processing rather than of the upload.
_RESET_DOCUMENT_STATUS = text(
    "UPDATE rag.document SET status = 'processing' WHERE id = CAST(:id AS uuid)"
)


# ── Tenants ─────────────────────────────────────────────────────────────────


@router.get("/tenants")
async def list_tenants(staff: StaffReq) -> dict[str, Any]:
    tenants = await AdminRepository(staff.session).tenants()
    return {"tenants": [_tenant_json(t) for t in tenants]}


@router.get("/tenants/{tenant_id}")
async def tenant_detail(tenant_id: uuid.UUID, staff: StaffReq) -> dict[str, Any]:
    repository = AdminRepository(staff.session)
    tenant = await repository.tenant(tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "tenant": _tenant_json(tenant),
        "members": await repository.tenant_members(tenant_id),
        "properties": await repository.tenant_properties(tenant_id),
        "questions": [
            _question_json(q)
            for q in await repository.questions(tenant_id=tenant_id, limit=10)
        ],
        "documents": [
            _document_json(d) for d in await repository.documents(tenant_id=tenant_id)
        ][:10],
    }


# ── Questions ───────────────────────────────────────────────────────────────


@router.get("/questions")
async def list_questions(
    staff: StaffReq,
    tenant_id: uuid.UUID | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
    turn_status: Annotated[str | None, Query(alias="status")] = None,
    search: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
) -> dict[str, Any]:
    """Every question ever asked, filtered (§11).

    `status` is renamed on the way in because `status` is also FastAPI's
    imported module in this file, and shadowing it inside a handler is the kind
    of bug that only shows up on the error path.
    """
    repository = AdminRepository(staff.session)
    rows = await repository.questions(
        tenant_id=tenant_id,
        since=since,
        until=until,
        status=turn_status,
        search=search,
        limit=PAGE_SIZE,
        offset=(page - 1) * PAGE_SIZE,
    )
    # The same predicate as the rows, spelled out again rather than packed into
    # a dict and splatted: mypy checks these call sites and would not check the
    # dict, and a pager whose total disagrees with its rows is worse than none.
    total = await repository.question_count(
        tenant_id=tenant_id,
        since=since,
        until=until,
        status=turn_status,
        search=search,
    )
    return {
        "questions": [_question_json(q) for q in rows],
        "total": total,
        "page": page,
        "page_size": PAGE_SIZE,
    }


@router.get("/questions.csv")
async def export_questions(
    staff: StaffReq,
    tenant_id: uuid.UUID | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
    turn_status: Annotated[str | None, Query(alias="status")] = None,
    search: str | None = None,
) -> Response:
    """The same rows as a CSV, for the pivot table nobody will build here.

    Written to a string rather than streamed: the row cap makes the result
    bounded, and a streaming response would hold the staff session — and the
    connection under it — open for the whole download.
    """
    rows = await AdminRepository(staff.session).questions_for_export(
        tenant_id=tenant_id,
        since=since,
        until=until,
        status=turn_status,
        search=search,
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "asked_at",
            "tenant",
            "user",
            "status",
            "question",
            "latency_ms",
            "cost_inr",
            "turn_id",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row.asked_at.isoformat(),
                row.tenant_name,
                row.user_email or "",
                row.status,
                row.question,
                row.latency_ms if row.latency_ms is not None else "",
                f"{row.cost_inr:.4f}",
                str(row.turn_id),
            ]
        )

    stamp = datetime.now(UTC).strftime("%Y%m%d")
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="soyl-questions-{stamp}.csv"',
            # §6.7. A CSV of every question anyone has asked is not a thing to
            # leave in an intermediary's cache.
            "Cache-Control": "no-store, no-transform",
        },
    )


# ── Answer inspector ────────────────────────────────────────────────────────


@router.get("/turns/{turn_id}")
async def inspect_turn(turn_id: uuid.UUID, staff: StaffReq) -> dict[str, Any]:
    """Why did it say that (§11, handbook §27.3).

    The acceptance criterion for the whole milestone is that someone can open
    this and explain an answer in under a minute, so it returns everything at
    once rather than making the UI chase links: the question, the scope, every
    chunk with its score and whether it survived the threshold, the model's raw
    draft, what the validator stripped, the final envelope, the money and any
    feedback.
    """
    inspection = await AdminRepository(staff.session).inspect(turn_id)
    if inspection is None:
        raise HTTPException(status_code=404, detail="Turn not found")

    return {
        "turn": {
            "turn_id": str(inspection.turn_id),
            "conversation_id": str(inspection.conversation_id),
            "tenant_id": str(inspection.tenant_id),
            "tenant_name": inspection.tenant_name,
            "user_email": inspection.user_email,
            "question": inspection.question,
            "status": inspection.status,
            "asked_at": inspection.asked_at,
            "completed_at": inspection.completed_at,
            "latency_ms": inspection.latency_ms,
            "input_tokens": inspection.input_tokens,
            "output_tokens": inspection.output_tokens,
            "cost_inr": float(inspection.cost_inr),
            # Carries the provider's error text for a failed turn, which is the
            # first thing to read when status is `failed`.
            "trace_id": inspection.trace_id,
        },
        "retrieval": {
            "query": inspection.retrieval_query,
            "filters": inspection.retrieval_filters,
            "reranked": inspection.reranked,
            "latency_ms": inspection.retrieval_ms,
            "kept": sum(1 for c in inspection.chunks if c.kept),
            "rejected": sum(1 for c in inspection.chunks if not c.kept),
        },
        "chunks": [
            {
                "chunk_id": str(c.chunk_id),
                "document_id": str(c.document_id) if c.document_id else None,
                "document_title": c.document_title,
                "heading_path": c.heading_path,
                "ordinal": c.ordinal,
                "token_count": c.token_count,
                "content": c.content,
                "score": c.score,
                "kept": c.kept,
            }
            for c in inspection.chunks
        ],
        "draft": inspection.draft,
        "strips": inspection.strips,
        "envelope": inspection.envelope,
        "usage": [
            {
                "kind": u.kind,
                "provider": u.provider,
                "model": u.model,
                "input_tokens": u.input_tokens,
                "output_tokens": u.output_tokens,
                "cost_inr": float(u.cost_inr),
            }
            for u in inspection.usage
        ],
        "feedback": inspection.feedback,
    }


# ── Documents ───────────────────────────────────────────────────────────────


@router.get("/documents")
async def list_documents(
    staff: StaffReq,
    tenant_id: uuid.UUID | None = None,
    doc_status: Annotated[str | None, Query(alias="status")] = None,
) -> dict[str, Any]:
    rows = await AdminRepository(staff.session).documents(
        tenant_id=tenant_id, status=doc_status
    )
    return {"documents": [_document_json(d) for d in rows]}


@router.post("/documents/{document_id}/reprocess", status_code=status.HTTP_202_ACCEPTED)
async def reprocess_document(
    document_id: uuid.UUID, staff: StaffReq, factory: Factory, request: Request
) -> dict[str, str]:
    """Re-run ingestion for a document that failed.

    Two sessions, and the second one is the point. The staff session can see
    which tenant owns the document and nothing more — `staff_read` is
    `FOR SELECT`. Creating the job therefore runs on a **tenant** session, so
    the row satisfies `tenant_isolation`'s `WITH CHECK` exactly as one created
    by the customer would.

    Audited separately from the access log, because "staff looked at documents"
    and "staff re-ran ingestion on this one" are different events and only the
    second one changed anything.
    """
    tenant_id = await AdminRepository(staff.session).document_tenant(document_id)
    if tenant_id is None:
        raise HTTPException(status_code=404, detail="Document not found")

    async with tenant_session(factory, tenant_id) as session:
        job = await IngestionJobRepository(session).create(
            document_id=document_id, tenant_id=tenant_id
        )
        await session.execute(
            _RESET_DOCUMENT_STATUS, {"id": str(document_id)}
        )
        await AuditRepository(session).record(
            action=audit_actions.ACTION_DOCUMENT_REPROCESS,
            outcome="success",
            actor_id=staff.principal.user_id,
            tenant_id=tenant_id,
            resource_kind="document",
            resource_id=str(document_id),
            ip=client_ip(request),
            after={"job_id": str(job.id), "by": staff.principal.email},
        )

    pool = await create_pool(redis_settings())
    try:
        await pool.enqueue_job(
            "ingest",
            tenant_id=str(tenant_id),
            document_id=str(document_id),
            job_id=str(job.id),
        )
    finally:
        await pool.aclose()

    return {"status": "queued", "job_id": str(job.id)}


# ── Funnel and cost ─────────────────────────────────────────────────────────


@router.get("/funnel")
async def funnel(staff: StaffReq, weeks: Annotated[int, Query(ge=1, le=52)] = 8) -> dict[str, Any]:
    rows = await AdminRepository(staff.session).funnel(weeks=weeks)
    return {
        "weeks": [
            {
                "week": row.week,
                "signed_up": row.signed_up,
                "verified": row.verified,
                "created_property": row.created_property,
                "uploaded_document": row.uploaded_document,
                "asked_question": row.asked_question,
                "returned_week_two": row.returned_week_two,
            }
            for row in rows
        ]
    }


@router.get("/cost")
async def cost(
    staff: StaffReq,
    days: Annotated[int, Query(ge=1, le=365)] = 30,
    tenant_id: uuid.UUID | None = None,
) -> dict[str, Any]:
    rows = await AdminRepository(staff.session).cost(days=days, tenant_id=tenant_id)
    return {
        "days": days,
        "rows": [
            {
                "day": row.day,
                "tenant_id": str(row.tenant_id),
                "tenant_name": row.tenant_name,
                "cost_inr": float(row.cost_inr),
                "input_tokens": row.input_tokens,
                "output_tokens": row.output_tokens,
                "calls": row.calls,
            }
            for row in rows
        ],
    }


# ── Impersonation ───────────────────────────────────────────────────────────


class ImpersonationOut(BaseModel):
    session_token: str
    expires_at: datetime
    tenant_id: uuid.UUID
    tenant_name: str
    acting_as: str


@router.post("/tenants/{tenant_id}/impersonate", response_model=ImpersonationOut)
async def impersonate(
    tenant_id: uuid.UUID, staff: StaffReq, factory: Factory, request: Request
) -> ImpersonationOut:
    """Mint a short-lived session acting as a member of `tenant_id`.

    §11: audited, time-boxed, banner shown. All three are elsewhere and this
    route only starts it — expiry is on the session row (30 minutes), the
    banner comes from `impersonated_by` being non-null on the resolved
    principal, and read-only comes from `Principal.read_only()` at resolution.

    The account impersonated is chosen deterministically (longest-standing
    owner), so two people reproducing the same report see the same data.
    """
    repository = AdminRepository(staff.session)
    tenant = await repository.tenant(tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")

    staff_repository = StaffRepository(staff.session)
    target = await staff_repository.target_user_for(tenant_id)
    if target is None:
        raise HTTPException(
            status_code=409,
            detail="That tenant has no active member to act as.",
        )
    target_user_id, target_email = target

    # `core.session` has no tenant column and no RLS, so the insert belongs on
    # an untenanted session — the same one an ordinary login uses.
    async with untenanted_session(factory) as session:
        session_id, token, expires_at = await StaffRepository(session).mint_impersonation(
            staff_id=staff.principal.user_id,
            target_user_id=target_user_id,
            tenant_id=tenant_id,
            ip=client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
        await AuditRepository(session).record(
            action=audit_actions.ACTION_IMPERSONATE_START,
            outcome="success",
            actor_id=staff.principal.user_id,
            resource_kind="tenant",
            resource_id=str(tenant_id),
            ip=client_ip(request),
            user_agent=request.headers.get("user-agent"),
            after={
                "by": staff.principal.email,
                "acting_as": target_email,
                "session_id": str(session_id),
                "expires_at": expires_at.isoformat(),
            },
        )

    return ImpersonationOut(
        session_token=token,
        expires_at=expires_at,
        tenant_id=tenant_id,
        tenant_name=tenant.name,
        acting_as=target_email,
    )


@router.post("/impersonation/end", status_code=status.HTTP_204_NO_CONTENT)
async def end_impersonation(
    request: Request,
    factory: Factory,
    authorization: Annotated[str | None, Header()] = None,
) -> Response:
    """Revoke an impersonated session.

    Deliberately **not** behind `StaffReq`: the caller here holds the
    impersonated token, not a staff one, and requiring staff credentials to
    stop impersonating would mean the way out is harder than the way in.

    It revokes only sessions that are impersonations, so this cannot be used to
    log an ordinary user out with a token someone else's browser leaked.
    """
    token = bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    async with untenanted_session(factory) as session:
        row = await SessionRepository(session).get_active(token)
        if row is not None and row.impersonated_by is not None:
            await SessionRepository(session).revoke(row.id)
            await AuditRepository(session).record(
                action=audit_actions.ACTION_IMPERSONATE_END,
                outcome="success",
                actor_id=row.impersonated_by,
                resource_kind="session",
                resource_id=str(row.id),
                ip=client_ip(request),
            )

    # 204 whether or not anything was revoked. An already-expired session and a
    # forged token both mean "you are not impersonating", and saying which
    # tells an attacker whether a token is live.
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Serialisation ───────────────────────────────────────────────────────────


def _tenant_json(tenant: Any) -> dict[str, Any]:
    return {
        "tenant_id": str(tenant.tenant_id),
        "name": tenant.name,
        "slug": tenant.slug,
        "status": tenant.status,
        "created_at": tenant.created_at,
        "member_count": tenant.member_count,
        "property_count": tenant.property_count,
        "document_count": tenant.document_count,
        "question_count": tenant.question_count,
        "last_active_at": tenant.last_active_at,
    }


def _question_json(row: Any) -> dict[str, Any]:
    return {
        "turn_id": str(row.turn_id),
        "conversation_id": str(row.conversation_id),
        "tenant_id": str(row.tenant_id),
        "tenant_name": row.tenant_name,
        "user_email": row.user_email,
        "question": row.question,
        "status": row.status,
        "asked_at": row.asked_at,
        "latency_ms": row.latency_ms,
        "cost_inr": float(row.cost_inr),
    }


def _document_json(row: Any) -> dict[str, Any]:
    return {
        "document_id": str(row.document_id),
        "tenant_id": str(row.tenant_id),
        "tenant_name": row.tenant_name,
        "title": row.title,
        "doc_type": row.doc_type,
        "status": row.status,
        "page_count": row.page_count,
        "chunk_count": row.chunk_count,
        "created_at": row.created_at,
        "job_status": row.job_status,
        "job_stage": row.job_stage,
        "job_error": row.job_error,
        "attempts": row.attempts,
    }
