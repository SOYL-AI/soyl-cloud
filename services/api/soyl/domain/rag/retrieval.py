"""What retrieval hands to everything above it.

A retrieved chunk is a domain concept, not a storage detail: the answer
pipeline, the envelope assembler and the validator all reason about one, and
none of them should have to import a repository to name the thing they are
holding. `import-linter`'s "the domain does not know how it is stored" contract
enforces that, and it caught this the first time it was written the other way
round.

Distinct from `chunking.Chunk`, which is the *output* of splitting a document
and has no identity yet — no id, no document, no tenant. They are different
stages of the same idea and conflating them would mean one of them carrying
fields that are meaningless for half its lifetime.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class RetrievedChunk:
    """A chunk as the answer pipeline needs it: identified, sourced, readable."""

    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    heading_path: list[str]
    content: str
    context_header: str | None
    ordinal: int
    # Empty when the document is not scoped to particular properties, which
    # means it applies to all of them.
    property_ids: list[uuid.UUID] = field(default_factory=list)
