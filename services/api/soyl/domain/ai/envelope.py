"""The Response Envelope.

`UPDATE.md` §6.3, non-negotiable: *"Answers are structured JSON, not markdown
strings, from the first answer the system ever gives."*

The reason that is a non-negotiable rather than a preference is that a markdown
string cannot be validated. Once an answer is prose, "does every claim cite a
chunk we actually retrieved" is a question nobody can ask a computer, and
§6.4's deterministic validator becomes impossible to write. Retrofitting
structure onto a product that shipped prose means rewriting every answer path
and every renderer at once, which is why the handbook puts it first.

Phase 0 needs four block types and no more: `text.markdown`, `doc.citation`,
`list.checklist`, `alert.callout`. Everything else in handbook §17 — charts,
tables, refresh specs, actions — serves later phases and is deliberately absent
rather than stubbed. A stub invites use.

**Two models, on purpose.**

`Draft*` is what the model is asked to produce: flat, with nullable fields
rather than a discriminated union, because Azure's strict `json_schema` mode
requires every property to be required and forbids additional ones, and a union
expressed under those rules is a shape models get wrong.

`Envelope` is what we persist and serve. Identifiers, timestamps, layout and
provenance resolution are added deterministically here, not asked for from a
model that would occasionally invent them. The gap between the two is where the
validator does its work.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

ENVELOPE_VERSION = 1

BlockType = Literal["text.markdown", "doc.citation", "list.checklist", "alert.callout"]
Confidence = Literal["high", "medium", "low"]
AlertLevel = Literal["info", "warning", "critical"]

# Why a turn ended. `no_evidence` is a first-class outcome, not an error:
# §9 calls refusal "a valid, well-designed outcome" and the whole product
# depends on it looking deliberate rather than broken.
TurnStatus = Literal["complete", "no_evidence", "refused", "failed"]


# ── What the model is asked for ─────────────────────────────────────────────


class DraftBlock(BaseModel):
    """One block as the synthesiser produces it.

    Flat rather than a union: every field is present on every block and unused
    ones are null. That is uglier than four separate models and it is what a
    strict JSON schema can actually express, so the model never has to pick a
    variant — it fills in the fields its `type` uses.
    """

    model_config = ConfigDict(extra="forbid")

    type: BlockType
    title: str | None = None
    # Used by text.markdown and alert.callout.
    markdown: str | None = None
    # Used by alert.callout.
    level: AlertLevel | None = None
    # Used by list.checklist.
    items: list[str] = Field(default_factory=list)
    # Used by doc.citation: the chunk being quoted, and the words themselves.
    quote: str | None = None
    # Chunk ids supporting this block. §6.4: every factual statement references
    # a retrieved chunk. The validator checks these against what retrieval
    # actually returned and strips what does not match — so a hallucinated id
    # costs the block, not the answer's credibility.
    provenance: list[str] = Field(default_factory=list)


class DraftAnswer(BaseModel):
    """The synthesiser's whole output."""

    model_config = ConfigDict(extra="forbid")

    headline: str
    blocks: list[DraftBlock] = Field(default_factory=list)
    followups: list[str] = Field(default_factory=list)


# ── What we persist and serve ───────────────────────────────────────────────


class TextMarkdownPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    markdown: str


class ChecklistItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str
    done: bool = False


class ListChecklistPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[ChecklistItem] = Field(default_factory=list)


class AlertCalloutPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    level: AlertLevel = "info"
    markdown: str


class DocCitationPayload(BaseModel):
    """A quotation with everything needed to show the user where it came from.

    Denormalised deliberately. A citation that stores only `chunk_id` is a
    citation that stops rendering the day the document is deleted — and an
    answer whose sources have silently become unreadable is worse than one that
    never claimed them.
    """

    model_config = ConfigDict(extra="forbid")

    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    heading_path: list[str] = Field(default_factory=list)
    quote: str


class TextMarkdownBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    type: Literal["text.markdown"] = "text.markdown"
    title: str | None = None
    payload: TextMarkdownPayload
    provenance_refs: list[str] = Field(default_factory=list)
    confidence: Confidence = "medium"


class DocCitationBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    type: Literal["doc.citation"] = "doc.citation"
    title: str | None = None
    payload: DocCitationPayload
    provenance_refs: list[str] = Field(default_factory=list)
    confidence: Confidence = "high"


class ListChecklistBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    type: Literal["list.checklist"] = "list.checklist"
    title: str | None = None
    payload: ListChecklistPayload
    provenance_refs: list[str] = Field(default_factory=list)
    confidence: Confidence = "medium"


class AlertCalloutBlock(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    type: Literal["alert.callout"] = "alert.callout"
    title: str | None = None
    payload: AlertCalloutPayload
    provenance_refs: list[str] = Field(default_factory=list)
    confidence: Confidence = "medium"


Block = Annotated[
    TextMarkdownBlock | DocCitationBlock | ListChecklistBlock | AlertCalloutBlock,
    Field(discriminator="type"),
]


class SourceRef(BaseModel):
    """One retrieved chunk, referenced by blocks rather than duplicated in them.

    Blocks carry `provenance_refs` pointing at these ids, so a chunk cited by
    six blocks is described once. It is also the list the source drawer renders,
    which is why it carries enough to be readable on its own.
    """

    model_config = ConfigDict(extra="forbid")

    id: str
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    heading_path: list[str] = Field(default_factory=list)
    excerpt: str
    # Post-rerank score where there was one. Null when reranking was skipped,
    # which the answer inspector needs to distinguish from a score of zero.
    score: float | None = None


class Provenance(BaseModel):
    model_config = ConfigDict(extra="forbid")
    documents: list[SourceRef] = Field(default_factory=list)


class Summary(BaseModel):
    model_config = ConfigDict(extra="forbid")
    headline: str
    confidence: Confidence = "medium"


class Intent(BaseModel):
    """What the system understood the question to be asking.

    Rendered so the user can see and correct it. §16.2: if the system misread
    the scope, fixing a chip is one click and retyping the question is not.
    """

    model_config = ConfigDict(extra="forbid")

    question: str
    property_ids: list[uuid.UUID] = Field(default_factory=list)
    # What the system could not resolve. Drives the clarification UI, and an
    # empty list is the normal case.
    unresolved: list[str] = Field(default_factory=list)


class LayoutSlot(BaseModel):
    model_config = ConfigDict(extra="forbid")
    block_id: str
    span: int = 4


class Layout(BaseModel):
    """Advisory. A client is free to ignore it and render blocks in order.

    It exists so structure can stream before content (§9.3), not so the server
    can dictate presentation.
    """

    model_config = ConfigDict(extra="forbid")

    kind: Literal["stack", "grid"] = "stack"
    cols: int = 4
    slots: list[LayoutSlot] = Field(default_factory=list)


class Usage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    input_tokens: int = 0
    output_tokens: int = 0
    cost_inr: float = 0.0
    wall_ms: int = 0


class Diagnostics(BaseModel):
    """What went wrong, or nearly did, in producing this answer.

    `degraded` is true when the answer is real but the pipeline did not run as
    designed — the reranker timed out, a claim was stripped. It is surfaced
    rather than hidden because a silently degraded answer is indistinguishable
    from a good one until someone acts on it.
    """

    model_config = ConfigDict(extra="forbid")

    degraded: bool = False
    warnings: list[str] = Field(default_factory=list)
    reranked: bool = False
    # Blocks the validator removed. §6.4 requires the strip to be logged; this
    # is that log, carried on the envelope so the answer inspector can show it
    # without a second query.
    stripped_blocks: int = 0
    usage: Usage = Field(default_factory=Usage)


class Envelope(BaseModel):
    """The single artifact the answer pipeline produces."""

    model_config = ConfigDict(extra="forbid")

    envelope_id: uuid.UUID
    version: int = ENVELOPE_VERSION
    turn_id: uuid.UUID
    conversation_id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    locale: str = "en-IN"
    status: TurnStatus = "complete"

    intent: Intent
    summary: Summary
    layout: Layout = Field(default_factory=Layout)
    blocks: list[Block] = Field(default_factory=list)
    provenance: Provenance = Field(default_factory=Provenance)
    followups: list[str] = Field(default_factory=list)
    diagnostics: Diagnostics = Field(default_factory=Diagnostics)

    @property
    def cited_chunk_ids(self) -> set[uuid.UUID]:
        return {source.chunk_id for source in self.provenance.documents}
