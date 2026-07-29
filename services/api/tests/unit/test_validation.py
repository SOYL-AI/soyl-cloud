"""The provenance validator.

`UPDATE.md` §6.4 calls this "the entire reason the product will be trusted", so
the tests are about the ways a wrong answer gets through rather than the ways
a right one does.

The failure this guards against is specific and quiet: a model produces a
well-formed citation of a chunk that was never retrieved. It renders exactly
like a real citation, links to a real-looking source, and a reader has no way
to tell. Nothing downstream can catch it, because everything downstream trusts
the envelope.
"""

from __future__ import annotations

import uuid

from soyl.domain.ai.envelope import (
    AlertCalloutBlock,
    AlertCalloutPayload,
    Block,
    ChecklistItem,
    DocCitationBlock,
    DocCitationPayload,
    ListChecklistBlock,
    ListChecklistPayload,
    TextMarkdownBlock,
    TextMarkdownPayload,
)
from soyl.domain.ai.validation import validate_blocks

RETRIEVED = uuid.uuid4()
NEVER_RETRIEVED = uuid.uuid4()


def text_block(*refs: uuid.UUID, block_id: str = "b1") -> Block:
    return TextMarkdownBlock(
        id=block_id,
        payload=TextMarkdownPayload(markdown="Corporate bookings cancel free at 48 hours."),
        provenance_refs=[str(ref) for ref in refs],
    )


def test_a_block_citing_a_retrieved_chunk_survives() -> None:
    result = validate_blocks([text_block(RETRIEVED)], retrieved={RETRIEVED})

    assert len(result.blocks) == 1
    assert not result.degraded


def test_a_block_citing_a_chunk_that_was_never_retrieved_is_stripped() -> None:
    """The failure this module exists for.

    The citation is well-formed and points at a real UUID. Nothing about it
    looks wrong. Only set arithmetic against what retrieval actually returned
    can tell, which is why this check is deterministic rather than a model
    being asked to check its own work.
    """
    result = validate_blocks([text_block(NEVER_RETRIEVED)], retrieved={RETRIEVED})

    assert result.blocks == []
    assert result.strips[0].reason.startswith("cites")


def test_a_claim_with_no_citation_at_all_is_stripped() -> None:
    result = validate_blocks([text_block()], retrieved={RETRIEVED})

    assert result.blocks == []
    assert result.strips[0].reason == "no provenance"


def test_one_bad_block_does_not_cost_the_whole_answer() -> None:
    """Stripping, not failing.

    Failing the turn would mean one bad block costs a user their answer, and
    the pressure to relax the check would arrive within a week.
    """
    good = text_block(RETRIEVED, block_id="b1")
    bad = text_block(NEVER_RETRIEVED, block_id="b2")

    result = validate_blocks([good, bad], retrieved={RETRIEVED})

    assert [block.id for block in result.blocks] == ["b1"]
    assert result.degraded


def test_a_checklist_must_be_provenanced() -> None:
    """The most dangerous block type we produce.

    A checklist reads as a procedure to follow. An invented step in a fire
    evacuation checklist is the worst output this system could generate, so it
    is held to the same standard as prose rather than treated as formatting.
    """
    block = ListChecklistBlock(
        id="b1",
        payload=ListChecklistPayload(items=[ChecklistItem(text="Evacuate via the north stair")]),
        provenance_refs=[],
    )

    result = validate_blocks([block], retrieved={RETRIEVED})

    assert result.blocks == []


def test_an_alert_may_speak_without_citing_anything() -> None:
    """The exception, and it is load-bearing.

    An alert carries the pipeline's own voice — "no document covers this". It
    is a statement about our corpus, not a claim drawn from it. Requiring a
    citation would strip exactly the message whose content is that there are no
    chunks to cite, and the refusal path would return an empty answer instead
    of an explanation.
    """
    block = AlertCalloutBlock(
        id="b1",
        payload=AlertCalloutPayload(level="info", markdown="No document covers that."),
        provenance_refs=[],
    )

    result = validate_blocks([block], retrieved=set())

    assert len(result.blocks) == 1
    assert not result.degraded


def test_a_quotation_of_an_unretrieved_chunk_is_stripped() -> None:
    """A dead link in the one place the user goes to check us."""
    block = DocCitationBlock(
        id="b1",
        payload=DocCitationPayload(
            chunk_id=NEVER_RETRIEVED,
            document_id=uuid.uuid4(),
            document_title="Front Office SOP",
            quote="Corporate reservations may be cancelled without penalty.",
        ),
        provenance_refs=[str(RETRIEVED)],
    )

    result = validate_blocks([block], retrieved={RETRIEVED})

    assert result.blocks == []
    assert "quotes" in result.strips[0].reason


def test_an_empty_quotation_is_stripped() -> None:
    block = DocCitationBlock(
        id="b1",
        payload=DocCitationPayload(
            chunk_id=RETRIEVED,
            document_id=uuid.uuid4(),
            document_title="Front Office SOP",
            quote="   ",
        ),
        provenance_refs=[str(RETRIEVED)],
    )

    assert validate_blocks([block], retrieved={RETRIEVED}).blocks == []


def test_a_reference_that_is_not_an_id_counts_as_no_reference() -> None:
    """Models produce reference-shaped strings that are not ids.

    "chunk_3", "the SOP", "source 1". Raising on those would turn a bad
    citation into a failed turn, which is the trade this module avoids — so
    they are treated as absent and the block is stripped like any other
    unprovenanced claim.
    """
    block = TextMarkdownBlock(
        id="b1",
        payload=TextMarkdownPayload(markdown="Something confident."),
        provenance_refs=["chunk_3", "the SOP"],
    )

    result = validate_blocks([block], retrieved={RETRIEVED})

    assert result.blocks == []
    assert result.strips[0].reason == "no provenance"


def test_a_block_citing_one_real_and_one_invented_chunk_is_stripped() -> None:
    """Partial grounding is not grounding.

    Keeping it because *some* citation checked out would let a fabricated
    source ride along with a real one, which is precisely how a wrong claim
    acquires the appearance of evidence.
    """
    result = validate_blocks(
        [text_block(RETRIEVED, NEVER_RETRIEVED)], retrieved={RETRIEVED}
    )

    assert result.blocks == []


def test_every_strip_records_what_and_why() -> None:
    """§6.4 requires the strip to be logged, and a count cannot be investigated."""
    result = validate_blocks([text_block(NEVER_RETRIEVED)], retrieved={RETRIEVED})

    strip = result.strips[0]
    assert strip.block_id == "b1"
    assert strip.block_type == "text.markdown"
    assert strip.reason
