"""Turning a draft into an envelope.

Everything a model should not be trusted to produce is produced here: block
ids, source ids, layout, timestamps, and the resolution of chunk references
into readable source entries.

The division is the useful part. Asking a model for identifiers gets you
plausible ones that collide, repeat, or point at nothing; asking it for prose
and doing the bookkeeping ourselves means a malformed answer is a validation
failure rather than a corrupted record.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from soyl.domain.ai.envelope import (
    AlertCalloutBlock,
    AlertCalloutPayload,
    Block,
    ChecklistItem,
    Diagnostics,
    DocCitationBlock,
    DocCitationPayload,
    DraftAnswer,
    DraftBlock,
    Envelope,
    Intent,
    Layout,
    LayoutSlot,
    ListChecklistBlock,
    ListChecklistPayload,
    Provenance,
    SourceRef,
    Summary,
    TextMarkdownBlock,
    TextMarkdownPayload,
    TurnStatus,
    Usage,
)
from soyl.domain.ai.validation import Strip, validate_blocks
from soyl.domain.rag.retrieval import RetrievedChunk

# How much of a chunk the source drawer shows before the reader opens it.
EXCERPT_CHARS = 400

# Used whenever nothing grounded survives. See `assemble`.
NO_EVIDENCE_HEADLINE = "No document covers that."


def source_refs(chunks: list[RetrievedChunk], scores: list[float]) -> list[SourceRef]:
    """One entry per retrieved chunk, in the order retrieval ranked them."""
    return [
        SourceRef(
            id=f"s{index}",
            chunk_id=chunk.chunk_id,
            document_id=chunk.document_id,
            document_title=chunk.document_title,
            heading_path=list(chunk.heading_path),
            excerpt=chunk.content[:EXCERPT_CHARS],
            score=scores[index - 1] if index - 1 < len(scores) else None,
        )
        for index, chunk in enumerate(chunks, start=1)
    ]


def build_blocks(draft: DraftAnswer, chunks: list[RetrievedChunk]) -> list[Block]:
    """Convert draft blocks into typed ones, discarding what cannot convert.

    A draft block whose payload is empty for its own type — a `text.markdown`
    with no markdown, a checklist with no items — is dropped here rather than
    rendered as a blank card. It is not a provenance failure, so it is not the
    validator's business; it is simply nothing.
    """
    by_id = {chunk.chunk_id: chunk for chunk in chunks}
    blocks: list[Block] = []

    for index, item in enumerate(draft.blocks, start=1):
        block = _convert(item, block_id=f"b{index}", by_id=by_id)
        if block is not None:
            blocks.append(block)

    return blocks


def _convert(
    draft: DraftBlock, *, block_id: str, by_id: dict[uuid.UUID, RetrievedChunk]
) -> Block | None:
    refs = list(draft.provenance)

    if draft.type == "text.markdown":
        if not (draft.markdown or "").strip():
            return None
        return TextMarkdownBlock(
            id=block_id,
            title=draft.title,
            payload=TextMarkdownPayload(markdown=draft.markdown or ""),
            provenance_refs=refs,
        )

    if draft.type == "alert.callout":
        if not (draft.markdown or "").strip():
            return None
        return AlertCalloutBlock(
            id=block_id,
            title=draft.title,
            payload=AlertCalloutPayload(
                level=draft.level or "info", markdown=draft.markdown or ""
            ),
            provenance_refs=refs,
        )

    if draft.type == "list.checklist":
        items = [text.strip() for text in draft.items if text and text.strip()]
        if not items:
            return None
        return ListChecklistBlock(
            id=block_id,
            title=draft.title,
            payload=ListChecklistPayload(
                items=[ChecklistItem(text=text) for text in items]
            ),
            provenance_refs=refs,
        )

    if draft.type == "doc.citation":
        # A citation is built from *our* record of the chunk, never from what
        # the model said about it. The model chooses which chunk to quote and
        # supplies the words; the document title, id and heading path come from
        # the row. A model-supplied title is a plausible title, which in a
        # citation is worse than none.
        chunk_id = _first_known(refs, by_id)
        if chunk_id is None or not (draft.quote or "").strip():
            return None
        chunk = by_id[chunk_id]
        return DocCitationBlock(
            id=block_id,
            title=draft.title,
            payload=DocCitationPayload(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                document_title=chunk.document_title,
                heading_path=list(chunk.heading_path),
                quote=draft.quote or "",
            ),
            provenance_refs=[str(chunk.chunk_id)],
        )

    return None


def _first_known(refs: list[str], by_id: dict[uuid.UUID, RetrievedChunk]) -> uuid.UUID | None:
    for ref in refs:
        try:
            parsed = uuid.UUID(ref)
        except (ValueError, AttributeError, TypeError):
            continue
        if parsed in by_id:
            return parsed
    return None


def stack_layout(blocks: list[Block]) -> Layout:
    """Full-width, in order.

    Phase 0 has no chart or metric blocks, so there is nothing a grid would
    usefully place side by side. A grid here would be structure for its own
    sake, and §13.1 makes layout advisory anyway.
    """
    return Layout(
        kind="stack",
        cols=4,
        slots=[LayoutSlot(block_id=block.id, span=4) for block in blocks],
    )


def assemble(
    draft: DraftAnswer,
    *,
    turn_id: uuid.UUID,
    conversation_id: uuid.UUID,
    tenant_id: uuid.UUID,
    question: str,
    chunks: list[RetrievedChunk],
    scores: list[float],
    property_ids: list[uuid.UUID] | None = None,
    reranked: bool = False,
    had_evidence: bool = True,
    usage: Usage | None = None,
    warnings: list[str] | None = None,
) -> tuple[Envelope, list[Strip]]:
    """Draft in, validated envelope out, with whatever was stripped.

    The strips are returned rather than only counted because §6.4 requires the
    strip to be logged, and a count cannot be investigated.
    """
    blocks = build_blocks(draft, chunks)
    retrieved = {chunk.chunk_id for chunk in chunks}

    validated = validate_blocks(blocks, retrieved=retrieved)

    # Renumbered after validation so the ids the client sees are contiguous.
    # Layout slots reference them, and a gap would look like a block that
    # failed to arrive rather than one that was never sent.
    kept: list[Block] = []
    for index, block in enumerate(validated.blocks, start=1):
        kept.append(block.model_copy(update={"id": f"b{index}"}))

    everything = warnings[:] if warnings else []
    everything += [f"stripped {strip.block_type} ({strip.reason})" for strip in validated.strips]

    cited = _cited(source_refs(chunks, scores), kept)

    # Three conditions, and the third was missing for a while.
    #
    # `had_evidence` covers retrieval finding nothing. `kept` covers the
    # validator removing everything. Neither catches the case the eval found:
    # retrieval returns weakly related chunks, the synthesiser correctly
    # judges them insufficient and says "the documents do not cover this" —
    # and because that refusal is an alert, and alerts are exempt from
    # provenance, it survived validation and the turn was recorded `complete`.
    #
    # It looked like a bug in the measurement. It was a bug in the product:
    # `ai.turn` is the permanent question log, and §6.5's whole point is
    # answering "what did people ask that we could not answer". Every
    # synthesiser-level refusal was invisible to that query — which is the
    # subset most worth reading, because the corpus nearly covered them.
    #
    # An answer citing nothing is not an answer from documents, whatever it
    # says. Prose without provenance is already stripped, so anything reaching
    # here uncited is an alert speaking in our own voice.
    status: TurnStatus = "complete" if kept and had_evidence and cited else "no_evidence"

    envelope = Envelope(
        envelope_id=uuid.uuid4(),
        turn_id=turn_id,
        conversation_id=conversation_id,
        tenant_id=tenant_id,
        created_at=datetime.now(UTC),
        status=status,
        intent=Intent(question=question, property_ids=list(property_ids or [])),
        summary=Summary(
            # The headline is a claim, and it carries no provenance refs of its
            # own — so stripping every block still left the model's assertion
            # in the most prominent field in the envelope. That is worse than a
            # bad block: the headline is what lists, notifications and the
            # turn's aria-label render, so it is read by people who never open
            # the answer.
            #
            # Found by an integration test where a fabricated citation was
            # correctly stripped and "cancel free up to 24 hours" survived
            # anyway, against a corpus that says 48.
            #
            # Honest limit: a *partly* stripped answer can still carry a
            # headline summarising a block that was removed. `degraded` and the
            # warnings record it; detecting it properly needs semantic checking
            # and is not something this stage can do.
            headline=(
                draft.headline.strip() or NO_EVIDENCE_HEADLINE
                if status == "complete"
                else NO_EVIDENCE_HEADLINE
            ),
            confidence="high" if kept and not validated.strips else "medium",
        ),
        layout=stack_layout(kept),
        blocks=kept,
        # Only chunks something actually cites. Listing all thirty retrieved
        # chunks would make the source drawer a search-results page and bury
        # the two that matter.
        provenance=Provenance(documents=cited),
        followups=[f.strip() for f in draft.followups if f and f.strip()][:3],
        diagnostics=Diagnostics(
            degraded=validated.degraded or bool(warnings),
            warnings=everything,
            reranked=reranked,
            stripped_blocks=len(validated.strips),
            usage=usage or Usage(),
        ),
    )

    return envelope, validated.strips


def _cited(sources: list[SourceRef], blocks: list[Block]) -> list[SourceRef]:
    referenced: set[str] = set()
    for block in blocks:
        referenced.update(block.provenance_refs)

    return [source for source in sources if str(source.chunk_id) in referenced]
