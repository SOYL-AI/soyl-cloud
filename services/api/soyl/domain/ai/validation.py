"""The provenance validator.

`UPDATE.md` §6.4, non-negotiable: *"Every factual statement in an answer
references a retrieved chunk ID. The validation stage strips unprovenanced
claims before the answer reaches the user and logs the strip. This is the
entire reason the product will be trusted."*

Deterministic, and that is the point. Asking a model whether its own answer was
grounded produces a confident yes, because the same process that invented the
claim invents the justification. This is set arithmetic against the chunk ids
retrieval actually returned, so a fabricated citation cannot survive contact
with it however plausible it looks.

**Stripping, not failing.** A block with a bad citation is removed and the rest
of the answer is delivered, marked degraded. Failing the whole turn would mean
one bad block costs a user their answer, and the pressure to relax the check
would arrive within a week. Removing the block costs the block.

What is *not* checked here, and is worth being honest about: whether a block's
text is actually supported by the chunk it cites. That requires reading both,
which is a model's job and a later phase's problem. This catches citations of
chunks that were never retrieved and claims made with no citation at all —
which is the large majority of what goes wrong, and all of what goes wrong
silently.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from soyl.domain.ai.envelope import Block, DocCitationBlock

# Types that assert something about the world and therefore need a source.
#
# `list.checklist` is here because a checklist is the most dangerous block we
# produce: it reads as a procedure to follow, and an invented step in a fire
# evacuation checklist is the worst output this system could generate.
CLAIM_BEARING = frozenset({"text.markdown", "list.checklist", "doc.citation"})

# `alert.callout` is deliberately absent. It carries the pipeline's own voice —
# "no document covers this", "this policy expired in 2023" — which is a
# statement about our corpus rather than a claim drawn from it. Requiring it to
# cite a chunk would strip exactly the message that says there are no chunks.


@dataclass(frozen=True, slots=True)
class Strip:
    """One removal, and why. Logged, and surfaced in the answer inspector."""

    block_id: str
    block_type: str
    reason: str


@dataclass
class ValidationResult:
    blocks: list[Block] = field(default_factory=list)
    strips: list[Strip] = field(default_factory=list)

    @property
    def degraded(self) -> bool:
        return bool(self.strips)


def validate_blocks(blocks: list[Block], *, retrieved: set[uuid.UUID]) -> ValidationResult:
    """Remove every block that cannot account for itself.

    `retrieved` is the set of chunk ids retrieval actually returned for this
    turn — not the corpus, and not what the model claims to have read.
    """
    result = ValidationResult()

    for block in blocks:
        reason = _rejection(block, retrieved=retrieved)
        if reason is None:
            result.blocks.append(block)
        else:
            result.strips.append(
                Strip(block_id=block.id, block_type=block.type, reason=reason)
            )

    return result


def _rejection(block: Block, *, retrieved: set[uuid.UUID]) -> str | None:
    """Why this block must not be shown, or None if it may be."""
    if block.type not in CLAIM_BEARING:
        return None

    refs = {_as_uuid(ref) for ref in block.provenance_refs}
    known = {ref for ref in refs if ref is not None}

    if not known:
        return "no provenance"

    invented = known - retrieved
    if invented:
        # The failure mode this whole module exists for: a well-formed citation
        # of a chunk that was never retrieved. It renders identically to a real
        # one, and a reader has no way to tell.
        return f"cites {len(invented)} chunk(s) that were not retrieved"

    if isinstance(block, DocCitationBlock):
        # A quotation block additionally has to quote something we actually
        # have. Its own chunk_id is what the source drawer opens, so a citation
        # pointing at an unretrieved chunk is a dead link in the one place the
        # user goes to check us.
        if block.payload.chunk_id not in retrieved:
            return "quotes a chunk that was not retrieved"
        if not block.payload.quote.strip():
            return "empty quotation"

    return None


def _as_uuid(value: str) -> uuid.UUID | None:
    """Parse a reference, treating anything unparseable as absent.

    Models produce reference-shaped strings that are not ids — "chunk_3",
    "the SOP". Raising on those would turn a bad citation into a failed turn,
    which is the trade this module is built to avoid.
    """
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError, TypeError):
        return None
