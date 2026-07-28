"""Getting text out of an uploaded file.

`UPDATE.md` §8: digital-native PDFs through `pymupdf`; scanned or
layout-complex documents through a layout-aware OCR service. **We do not have
that service yet**, so this module's job on a scanned PDF is to say so clearly
rather than to return three characters of text and let a document be indexed as
if it were empty.

That distinction is most of the value here. A corrupt file failing loudly is
M3's acceptance criterion; a scanned file failing *quietly* is worse than
either, because the document appears in the list as ready and answers nothing.
"""

from __future__ import annotations

import logging
import re

import pymupdf

# pymupdf ships partial inline types: Document.__init__ and .close() are
# untyped and page iteration is not declared, so mypy --strict rejects correct
# code. Scoped to this module, which is the only one that touches the library.
# mypy: disable-error-code="no-untyped-call,attr-defined"

logger = logging.getLogger("soyl.rag.extraction")

# A page yielding fewer characters than this has essentially no selectable
# text — it is an image. Deliberately tiny: the question is "is there text at
# all", not "is there much".
EMPTY_PAGE_CHARS = 12

# A scan is a document where nearly every page is an image. Measured as a
# proportion of empty pages rather than as a document-wide average, because an
# average rejects legitimate files with sparse pages — a rate card, a menu, a
# five-page SOP with one line each. That false positive costs a customer an
# upload they cannot explain, which is worse than occasionally accepting a scan
# and producing few chunks.
SCANNED_PAGE_RATIO = 0.8

# Refuse rather than spend two minutes discovering the same thing.
MAX_PAGES = 2_000

_EXCESS_BLANK_LINES = re.compile(r"\n{3,}")
# pymupdf preserves the hyphen when a word is broken across a line, which
# otherwise reaches the index as two fragments that match nothing.
_HYPHEN_BREAK = re.compile(r"(\w)-\n(\w)")


class ExtractionError(Exception):
    """Extraction failed in a way worth telling a person about.

    The message reaches the ingestion UI, so it is written for a hotel manager
    rather than for a log reader.
    """

    def __init__(self, message: str, *, retryable: bool = False) -> None:
        self.retryable = retryable
        super().__init__(message)


class ExtractedDocument:
    __slots__ = ("page_count", "text")

    def __init__(self, text: str, page_count: int) -> None:
        self.text = text
        self.page_count = page_count


def extract_pdf(data: bytes) -> ExtractedDocument:
    """Text and page count from a digital-native PDF."""
    try:
        document = pymupdf.open(stream=data, filetype="pdf")
    except Exception as exc:
        # Truncated uploads, files that are not PDFs, encrypted files. None is
        # retryable: the same bytes will fail identically.
        raise ExtractionError(
            "This file could not be opened as a PDF. It may be corrupted or "
            "password-protected. Try re-exporting it and uploading again."
        ) from exc

    try:
        if document.needs_pass:
            raise ExtractionError(
                "This PDF is password-protected. Remove the password and upload it again."
            )

        page_count = document.page_count
        if page_count == 0:
            raise ExtractionError("This PDF has no pages in it.")
        if page_count > MAX_PAGES:
            raise ExtractionError(
                f"This PDF has {page_count:,} pages, which is beyond what we can "
                f"process in one document. Split it and upload the parts."
            )

        pages = [document[index].get_text("text") for index in range(page_count)]
    except ExtractionError:
        raise
    except Exception as exc:
        raise ExtractionError(
            "We could not read the text out of this PDF. It may be damaged."
        ) from exc
    finally:
        document.close()

    text = _tidy("\n\n".join(pages))

    # The scanned-document check: how many pages have no selectable text at
    # all, rather than how dense the document is on average.
    empty_pages = sum(1 for page in pages if len(page.strip()) < EMPTY_PAGE_CHARS)
    if empty_pages / page_count >= SCANNED_PAGE_RATIO:
        raise ExtractionError(
            "This looks like a scanned document — we found almost no selectable "
            "text in it. Support for scanned files is coming; for now, please "
            "upload a version exported from the original."
        )

    return ExtractedDocument(text=text, page_count=page_count)


def extract_text_file(data: bytes) -> ExtractedDocument:
    """Plain text and markdown.

    Worth supporting properly: an SOP pasted into a `.md` file is a perfectly
    good document, and it is what most of our own test corpus is.
    """
    for encoding in ("utf-8", "utf-16", "cp1252", "latin-1"):
        try:
            decoded = data.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ExtractionError("We could not read this file as text.")

    text = _tidy(decoded)
    if not text.strip():
        raise ExtractionError("This file is empty.")

    # Page count is meaningless for text; None would be more honest but the
    # column is an int and 1 reads correctly in the UI.
    return ExtractedDocument(text=text, page_count=1)


def extract(data: bytes, *, content_type: str, filename: str) -> ExtractedDocument:
    """Dispatch on what the file actually is.

    Content type is a claim made by the uploader, so the magic bytes win. A
    file announced as a PDF that is not one should fail as "not a PDF", not as
    a mojibake wall of text that indexes cleanly and answers nothing.
    """
    if data[:5] == b"%PDF-":
        return extract_pdf(data)

    lowered = filename.lower()
    if content_type in ("text/plain", "text/markdown") or lowered.endswith((".txt", ".md")):
        return extract_text_file(data)

    if content_type == "application/pdf" or lowered.endswith(".pdf"):
        raise ExtractionError(
            "This file is named as a PDF but does not appear to be one. "
            "Try re-exporting it."
        )

    raise ExtractionError(
        "We can read PDF, plain text and Markdown files. Other formats are coming."
    )


def _tidy(text: str) -> str:
    """Normalise whitespace without destroying structure.

    Blank lines are what the chunker splits on, so they are collapsed rather
    than removed.
    """
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = _HYPHEN_BREAK.sub(r"\1\2", text)
    text = _EXCESS_BLANK_LINES.sub("\n\n", text)
    return "\n".join(line.rstrip() for line in text.split("\n")).strip()
