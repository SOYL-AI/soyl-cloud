"""Document upload and ingestion status.

Upload is three steps rather than one, and the shape is worth understanding:

1. `POST /v1/documents` — the caller says what it is about to upload. We create
   the row and hand back a short-lived presigned URL.
2. The browser `PUT`s the bytes **straight to storage**. They never pass
   through this service.
3. `POST /v1/documents/{id}/ingest` — the caller says the upload finished. We
   verify the object is really there, then enqueue.

The middle step is the point. A 40 MB PDF through a request worker occupies it
for the whole transfer, and Vercel's body limits would refuse it anyway. Step 3
exists because a presigned PUT gives us no callback — without it a browser that
crashes mid-upload leaves a document row pointing at nothing, forever.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime
from typing import Annotated

from arq import create_pool
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.sql import text

from soyl.domain.storage import ObjectNotFound, StoragePort, document_key
from soyl.infrastructure.db.repositories.document_repository import (
    ChunkRepository,
    DocumentRepository,
    IngestionJobRepository,
)
from soyl.infrastructure.queue.connection import redis_settings
from soyl.interface.http.authenticated import AuthedRequest
from soyl.interface.http.deps import get_storage

Storage = Annotated[StoragePort, Depends(get_storage)]

router = APIRouter(prefix="/v1/documents", tags=["documents"])

# Generous for an SOP or a contract, small enough that one upload cannot fill a
# bucket. Enforced when the upload is confirmed, because a presigned PUT cannot
# cap the body itself.
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
}


class DocumentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=120)
    title: str | None = Field(default=None, max_length=200)
    doc_type: str = Field(default="other", max_length=40)
    property_ids: list[uuid.UUID] = Field(default_factory=list)


class UploadTicketOut(BaseModel):
    document_id: uuid.UUID
    upload_url: str
    required_headers: dict[str, str]
    expires_in_seconds: int


class DocumentOut(BaseModel):
    id: uuid.UUID
    title: str
    doc_type: str
    status: str
    page_count: int | None
    created_at: datetime
    chunk_count: int = 0
    # Present only while something has gone wrong, so the UI can show the
    # message rather than a spinner that never resolves.
    stage: str | None = None
    error: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED, response_model=UploadTicketOut)
async def create_document(
    payload: DocumentCreate, authed: AuthedRequest, storage: Storage
) -> UploadTicketOut:
    """Reserve a document and hand back a short-lived upload URL."""
    authed.require("document:write")

    if payload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="We can read PDF, plain text and Markdown files. Other formats are coming.",
        )

    for property_id in payload.property_ids:
        if not authed.principal.may_use_property(property_id):
            # 404 rather than 403 — confirming the id is real would be a
            # cross-tenant existence check.
            raise HTTPException(status_code=404, detail="Property not found")

    document_id = uuid.uuid4()
    key = document_key(
        tenant_id=authed.principal.tenant_id,
        document_id=document_id,
        filename=payload.filename,
    )

    ticket = await storage.upload_ticket(
        key=key, content_type=payload.content_type, max_bytes=MAX_UPLOAD_BYTES
    )

    await DocumentRepository(authed.session).create(
        document_id=document_id,
        tenant_id=authed.principal.tenant_id,
        title=payload.title or payload.filename,
        doc_type=payload.doc_type,
        blob_uri=key,
        # A placeholder until the bytes exist and can be hashed. The unique
        # constraint on (tenant_id, checksum) needs a value, and the real one
        # is only knowable after the upload.
        checksum=f"pending:{document_id}",
        property_ids=payload.property_ids,
    )

    return UploadTicketOut(
        document_id=document_id,
        upload_url=ticket.url,
        required_headers=ticket.required_headers,
        expires_in_seconds=int(ticket.expires_in.total_seconds()),
    )


@router.post("/{document_id}/ingest", status_code=status.HTTP_202_ACCEPTED)
async def start_ingestion(
    document_id: uuid.UUID, authed: AuthedRequest, storage: Storage
) -> dict[str, str]:
    """Confirm the upload landed, then queue the work.

    Verifying the object exists is what stops a browser that died mid-upload
    from leaving a document row pointing at nothing.
    """
    authed.require("document:write")

    documents = DocumentRepository(authed.session)
    document = await documents.get(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        data = await storage.download(key=document.blob_uri)
    except ObjectNotFound as exc:
        raise HTTPException(
            status_code=409,
            detail="The upload did not complete. Please try uploading the file again.",
        ) from exc

    if len(data) > MAX_UPLOAD_BYTES:
        # The only place this can be enforced: a presigned PUT has no size cap.
        await storage.delete(key=document.blob_uri)
        await documents.delete(document_id)
        raise HTTPException(
            status_code=413,
            detail=f"That file is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    # Now the bytes exist, the real checksum can replace the placeholder — and
    # a re-upload of identical content collides on the unique constraint rather
    # than quietly doubling the corpus.
    checksum = hashlib.sha256(data).hexdigest()
    await authed.session.execute(
        text("UPDATE rag.document SET checksum = :checksum WHERE id = :id"),
        {"id": document_id, "checksum": checksum},
    )

    job = await IngestionJobRepository(authed.session).create(
        document_id=document_id, tenant_id=authed.principal.tenant_id
    )

    pool = await create_pool(redis_settings())
    try:
        await pool.enqueue_job(
            "ingest",
            tenant_id=str(authed.principal.tenant_id),
            document_id=str(document_id),
            job_id=str(job.id),
        )
    finally:
        await pool.aclose()

    return {"status": "queued", "job_id": str(job.id)}


@router.get("", response_model=list[DocumentOut])
async def list_documents(authed: AuthedRequest) -> list[DocumentOut]:
    """This tenant's documents, with whatever went wrong attached."""
    authed.require("document:read")

    documents = await DocumentRepository(authed.session).list_all()
    jobs = IngestionJobRepository(authed.session)
    chunks = ChunkRepository(authed.session)

    out: list[DocumentOut] = []
    for document in documents:
        job = await jobs.latest_for_document(document.id)
        out.append(
            DocumentOut(
                id=document.id,
                title=document.title,
                doc_type=document.doc_type,
                status=document.status,
                page_count=document.page_count,
                created_at=document.created_at,
                chunk_count=await chunks.count_for_document(document.id),
                stage=job.stage if job else None,
                error=job.error if job and job.status == "failed" else None,
            )
        )

    return out


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID, authed: AuthedRequest, storage: Storage
) -> None:
    """Erase a document: the row, its chunks, its questions, and the bytes.

    A real delete rather than a soft one. `ON DELETE CASCADE` removes
    everything derived from it, and the object is removed from storage in the
    same request — a soft-deleted document whose vectors remain in the index
    and whose PDF remains in a bucket is not erased, and "destroy and certify"
    is a processor obligation we will be audited against.
    """
    authed.require("document:write")

    documents = DocumentRepository(authed.session)
    document = await documents.get(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    blob_uri = document.blob_uri
    await documents.delete(document_id)

    # Deleting an absent object is not an error, so a retried erasure cannot
    # fail for having already succeeded.
    await storage.delete(key=blob_uri)
