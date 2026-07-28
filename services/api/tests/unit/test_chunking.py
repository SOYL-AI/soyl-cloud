"""Structure-first chunking.

The assertions are about *meaning surviving the split*, not about sizes. A
chunking function that produces neatly-sized pieces with the wrong heading
attached is worse than one that produces uneven pieces with the right one,
because the first kind fails invisibly at retrieval time.
"""

from __future__ import annotations

from soyl.domain.rag.chunking import (
    chunk_document,
    context_header,
    heading_level,
    heading_text,
    split_into_sections,
    split_oversized,
)


def words(text: str) -> int:
    """A stand-in tokeniser. Chunking must not depend on which one is used."""
    return len(text.split())


SOP = """# Guest Complaint Handling SOP

This procedure applies to all front-of-house staff.

## 1. Receiving a complaint

Listen without interrupting. Record the room number and the time.

## 3. Escalation

Complaints not resolved within fifteen minutes are escalated.

### 3.2 Noise complaints after 22:00

If a guest reports noise after 22:00, the duty manager must attend within ten
minutes. Do not offer compensation before verifying the complaint.
"""


def test_markdown_heading_depth() -> None:
    assert heading_level("# Title") == 1
    assert heading_level("### Deep") == 3
    assert heading_level("Just a sentence.") is None


def test_numbered_clauses_are_headings_and_nest_by_dots() -> None:
    # Contracts and SOPs number their clauses rather than using markdown, and
    # "3.2" has to nest under "3" or the path is wrong.
    assert heading_level("3. Escalation") == 1
    assert heading_level("3.2 Noise complaints after 22:00") == 2
    assert heading_text("3.2 Noise complaints after 22:00") == "3.2 Noise complaints after 22:00"


def test_a_lowercase_numbered_line_is_not_a_heading() -> None:
    # "1. take the key from reception" is a list item, not a section.
    assert heading_level("1. take the key from reception") is None


def test_sections_carry_the_full_heading_path() -> None:
    sections = split_into_sections(SOP)
    deepest = sections[-1]

    assert deepest.heading_path == [
        "Guest Complaint Handling SOP",
        "3. Escalation",
        "3.2 Noise complaints after 22:00",
    ]


def test_a_sibling_heading_replaces_rather_than_nests() -> None:
    """The bug this guards against attaches one section's path to another's text."""
    text = "# Doc\n\n## A\n\nAlpha body.\n\n## B\n\nBeta body.\n"
    sections = split_into_sections(text)

    beta = next(section for section in sections if "Beta" in section.text)
    assert beta.heading_path == ["Doc", "B"]
    assert "A" not in beta.heading_path


def test_every_chunk_keeps_a_heading_path() -> None:
    chunks = chunk_document(SOP, doc_type="sop", count_tokens=words)

    assert chunks
    assert all(chunk.heading_path for chunk in chunks)


def test_the_noise_procedure_stays_with_its_heading() -> None:
    """The §43.2 example, as an assertion.

    Without the path this chunk is generic text about noise and retrieves for
    nothing useful.
    """
    chunks = chunk_document(SOP, doc_type="sop", count_tokens=words)
    noise = next(chunk for chunk in chunks if "duty manager" in chunk.content)

    assert "3.2 Noise complaints after 22:00" in noise.heading_path
    assert "3. Escalation" in noise.heading_path


def test_ordinals_are_contiguous_and_ordered() -> None:
    # Ordinal is the unique key alongside document_id, and a gap would mean a
    # chunk was dropped somewhere.
    chunks = chunk_document(SOP, doc_type="sop", count_tokens=words)

    assert [chunk.ordinal for chunk in chunks] == list(range(len(chunks)))


def test_small_siblings_merge_rather_than_becoming_useless_chunks() -> None:
    """A 30-word subsection is not a retrieval unit (§43.1 step 2)."""
    text = "# Doc\n\n## A\n\nShort one.\n\n## B\n\nShort two.\n\n## C\n\nShort three.\n"

    merged = chunk_document(text, doc_type="sop", count_tokens=words)

    assert len(merged) < 3


def test_sections_under_different_parents_do_not_merge() -> None:
    """Merging across branches attaches one path to another's text.

    Worse than a short chunk, because it fails at retrieval rather than in a
    size metric.
    """
    text = (
        "# Doc\n\n## Cancellations\n\n### Corporate\n\nTiny.\n\n"
        "## Laundry\n\n### Turnaround\n\nAlso tiny.\n"
    )
    chunks = chunk_document(text, doc_type="contract", count_tokens=words)

    for chunk in chunks:
        if "Also tiny" in chunk.content:
            assert "Cancellations" not in chunk.heading_path


def test_an_oversized_section_is_split_on_sentences() -> None:
    long_body = " ".join(f"Sentence number {index} about policy." for index in range(400))
    text = f"# Doc\n\n## Long\n\n{long_body}\n"

    chunks = chunk_document(text, doc_type="sop", count_tokens=words)

    assert len(chunks) > 1
    assert all(chunk.token_count <= 900 for chunk in chunks)
    # Every piece keeps the path — the split is arbitrary, the meaning is not.
    assert all(chunk.heading_path == ["Doc", "Long"] for chunk in chunks)


def test_splitting_overlaps_so_a_claim_keeps_its_subject() -> None:
    pieces = split_oversized(
        " ".join(f"Sentence {index}." for index in range(200)), max_tokens=50, count=words
    )

    assert len(pieces) > 1
    # The tail of one piece reappears at the head of the next.
    tail = pieces[0].split()[-3:]
    assert any(word in pieces[1] for word in tail)


def test_structural_splits_do_not_overlap() -> None:
    """Overlap is a last resort, not the default.

    A heading boundary is meaningful, so duplicating text across it only
    inflates the corpus and retrieves the same passage twice.
    """
    text = "# Doc\n\n## A\n\n" + " ".join(["alpha"] * 600) + "\n\n## B\n\n" + " ".join(["beta"] * 600)

    chunks = chunk_document(text, doc_type="sop", count_tokens=words)
    a_chunks = [c for c in chunks if "A" in c.heading_path]
    b_chunks = [c for c in chunks if "B" in c.heading_path]

    assert a_chunks and b_chunks
    assert not any("beta" in chunk.content for chunk in a_chunks)


def test_an_empty_document_produces_no_chunks() -> None:
    assert chunk_document("", count_tokens=words) == []
    assert chunk_document("   \n\n  \n", count_tokens=words) == []


def test_a_document_with_no_headings_still_chunks() -> None:
    chunks = chunk_document("Just a plain paragraph of text.", count_tokens=words)

    assert len(chunks) == 1
    assert chunks[0].heading_path == []


def test_the_context_header_names_the_document_and_the_section() -> None:
    header = context_header(
        title="Guest Complaint Handling SOP (v4)",
        heading_path=["3. Escalation", "3.2 Noise complaints after 22:00"],
        effective="2026-01-15",
    )

    assert "Guest Complaint Handling SOP (v4)" in header
    assert "effective 2026-01-15" in header
    assert "3. Escalation > 3.2 Noise complaints after 22:00" in header
    assert header.endswith("---")


def test_a_root_level_chunk_says_so_rather_than_leaving_it_blank() -> None:
    # An empty Section: line would embed as noise.
    header = context_header(title="Menu", heading_path=[])

    assert "(document root)" in header
