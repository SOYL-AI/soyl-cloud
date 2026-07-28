"""Extraction, and how it fails.

M3's acceptance criterion says a deliberately corrupt file must fail "gracefully
with a readable error rather than a stack trace", so most of this file is about
failure. Every message is asserted to be something a hotel manager could act on
without knowing what a PDF is made of.
"""

from __future__ import annotations

import pymupdf
import pytest

from soyl.infrastructure.rag.extraction import ExtractionError, extract, extract_pdf


def make_pdf(pages: list[str]) -> bytes:
    """A real, digital-native PDF, built rather than fixtured."""
    document = pymupdf.open()
    for body in pages:
        page = document.new_page()
        page.insert_text((72, 72), body, fontsize=11)
    data: bytes = document.tobytes()
    document.close()
    return data


def make_image_only_pdf(page_count: int = 3) -> bytes:
    """Pages with no selectable text — what a scan looks like to pymupdf."""
    document = pymupdf.open()
    for _ in range(page_count):
        document.new_page()
    data: bytes = document.tobytes()
    document.close()
    return data


def test_a_digital_pdf_yields_its_text() -> None:
    result = extract_pdf(make_pdf(["Cancellation policy for corporate bookings"]))

    assert "Cancellation policy" in result.text
    assert result.page_count == 1


def test_page_count_is_reported() -> None:
    result = extract_pdf(make_pdf([f"Page {index} of the SOP" for index in range(1, 6)]))

    assert result.page_count == 5
    assert "Page 5" in result.text


def test_a_corrupt_file_fails_with_something_readable() -> None:
    """M3's acceptance criterion, as an assertion."""
    with pytest.raises(ExtractionError) as raised:
        extract_pdf(b"%PDF-1.7 this is not really a pdf at all")

    message = str(raised.value)
    assert "could not be opened" in message
    # No jargon, and something to do next.
    assert "upload" in message.lower()
    assert raised.value.retryable is False


def test_truncated_bytes_fail_rather_than_half_succeed() -> None:
    whole = make_pdf(["A complete document with several lines of text in it"])

    with pytest.raises(ExtractionError):
        extract_pdf(whole[: len(whole) // 3])


def test_a_scanned_document_is_refused_rather_than_indexed_empty() -> None:
    """The quiet failure this module exists to prevent.

    Indexing a scan as an empty document leaves it showing 'ready' in the list
    and answering nothing, which is worse than either succeeding or failing.
    """
    with pytest.raises(ExtractionError) as raised:
        extract_pdf(make_image_only_pdf())

    assert "scanned" in str(raised.value).lower()


def test_a_short_but_genuine_document_is_not_mistaken_for_a_scan() -> None:
    # The scan check is across the document, not per page, so a sparse page
    # among real ones must not trip it.
    data = make_pdf(
        [
            "Title page",
            "This page contains a substantial amount of genuine selectable text "
            "about the cancellation policy for corporate bookings and the "
            "notice period that applies to each rate plan we offer.",
        ]
    )

    assert extract_pdf(data).page_count == 2


def test_plain_text_is_supported() -> None:
    result = extract(b"# SOP\n\nBody text.", content_type="text/markdown", filename="sop.md")

    assert "Body text." in result.text


def test_an_empty_text_file_is_refused() -> None:
    with pytest.raises(ExtractionError, match="empty"):
        extract(b"   \n\n  ", content_type="text/plain", filename="empty.txt")


def test_magic_bytes_beat_the_declared_content_type() -> None:
    """Content type is a claim by the uploader, not a fact.

    A file announced as a PDF that is not one must fail as 'not a PDF' rather
    than index cleanly as a wall of mojibake that answers nothing.
    """
    with pytest.raises(ExtractionError) as raised:
        extract(b"\x00\x01\x02 binary junk", content_type="application/pdf", filename="x.pdf")

    assert "does not appear to be one" in str(raised.value)


def test_a_pdf_declared_as_text_is_still_read_as_a_pdf() -> None:
    result = extract(make_pdf(["Real PDF content here"]), content_type="text/plain", filename="x.txt")

    assert "Real PDF content" in result.text


def test_an_unsupported_format_says_what_is_supported() -> None:
    with pytest.raises(ExtractionError) as raised:
        extract(b"PK\x03\x04", content_type="application/zip", filename="archive.zip")

    message = str(raised.value)
    assert "PDF" in message and "Markdown" in message


def test_hyphenated_line_breaks_are_rejoined() -> None:
    """pymupdf keeps the hyphen when a word breaks across lines.

    Left alone, "cancel-\\nlation" reaches the index as two fragments that
    match nothing.
    """
    from soyl.infrastructure.rag.extraction import _tidy

    assert "cancellation" in _tidy("the cancel-\nlation policy")


def test_blank_lines_survive_because_the_chunker_splits_on_them() -> None:
    from soyl.infrastructure.rag.extraction import _tidy

    tidied = _tidy("# Heading\n\n\n\n\nBody paragraph.")

    assert "\n\n" in tidied
    assert "\n\n\n" not in tidied
