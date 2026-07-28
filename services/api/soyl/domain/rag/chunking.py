"""Structure-first chunking.

Handbook §43.1 is blunt about why the tutorial answer is wrong here: fixed-size
chunking with overlap "splits mid-clause, separates a table from its caption,
and destroys the heading path that gives a chunk its meaning." For a corpus of
SOPs and supplier contracts, the heading path *is* most of the meaning — a
paragraph about noise complaints is useless without "3.2 Noise complaints after
22:00" attached to it.

The algorithm:

1. Split on structure — headings, numbered clauses, list boundaries.
2. Merge small siblings until the target size is approached, because a 30-word
   subsection is not a useful retrieval unit.
3. Split oversized leaves on sentence boundaries, with ~15% overlap **only**
   in that case.
4. Attach the heading path to every chunk.

Pure domain: no PDF library, no tokeniser, no I/O. Token counting is injected
so this module can be tested with a trivial counter and run in production with
the real one.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field

# Per-doc-type targets from §43.1. A contract wants smaller chunks than an SOP
# because a clause is the unit someone asks about.
TARGETS: dict[str, tuple[int, int]] = {
    "sop": (500, 900),
    "policy": (500, 900),
    "contract": (400, 800),
    "menu": (400, 600),
    "catalogue": (400, 600),
    "notes": (400, 600),
    "brand_standards": (500, 800),
    "other": (500, 900),
}

# Overlap is a last resort, applied only when an oversized leaf has to be cut
# mid-thought. Structural splits need none — the boundary is meaningful.
OVERLAP_RATIO = 0.15

# A markdown heading, or a numbered clause like "3.2 Escalation" / "12. Term".
_HEADING = re.compile(
    r"^\s{0,3}(?:(?P<hashes>#{1,6})\s+(?P<hash_text>\S.*)"
    r"|(?P<number>\d+(?:\.\d+)*)\.?\s+(?P<number_text>[A-Z][^\n]{2,80}))\s*$"
)

# Sentence end followed by whitespace. Deliberately simple: the cost of an
# imperfect split inside an already-oversized leaf is low.
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


@dataclass(slots=True)
class Section:
    """A run of text under one heading path."""

    heading_path: list[str]
    lines: list[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        return "\n".join(self.lines).strip()


@dataclass(frozen=True, slots=True)
class Chunk:
    """One retrieval unit."""

    ordinal: int
    heading_path: list[str]
    content: str
    token_count: int


def heading_level(line: str) -> int | None:
    """Depth of a heading line, or None if it is not one.

    Markdown depth is the number of hashes. Numbered-clause depth is the number
    of dotted components, so "3.2" nests under "3".
    """
    match = _HEADING.match(line)
    if not match:
        return None

    if match.group("hashes"):
        return len(match.group("hashes"))
    return len(match.group("number").split("."))


def heading_text(line: str) -> str:
    match = _HEADING.match(line)
    if not match:
        return line.strip()

    if match.group("hashes"):
        return match.group("hash_text").strip()
    return f"{match.group('number')} {match.group('number_text')}".strip()


def split_into_sections(text: str) -> list[Section]:
    """Break a document at its headings, carrying the path down."""
    sections: list[Section] = []
    path: list[str] = []
    current = Section(heading_path=[])

    for line in text.splitlines():
        level = heading_level(line)

        if level is None:
            current.lines.append(line)
            continue

        if current.text:
            sections.append(current)

        # Truncate to the parent depth, then append. A level-2 heading after a
        # level-3 replaces the level-2 and drops the level-3.
        path = path[: level - 1]
        path.append(heading_text(line))
        current = Section(heading_path=list(path))

    if current.text:
        sections.append(current)

    return sections


def split_oversized(text: str, *, max_tokens: int, count: Callable[[str], int]) -> list[str]:
    """Cut a too-large section on sentence boundaries, with overlap.

    The only place overlap is used, and only because the boundary here is
    arbitrary — a sentence carried into the next piece keeps a claim from
    losing the subject it referred to.
    """
    sentences = [s for s in _SENTENCE_END.split(text) if s.strip()]
    if not sentences:
        return [text]

    pieces: list[str] = []
    current: list[str] = []

    for sentence in sentences:
        candidate = [*current, sentence]
        if current and count(" ".join(candidate)) > max_tokens:
            pieces.append(" ".join(current))
            overlap_budget = int(max_tokens * OVERLAP_RATIO)
            carried: list[str] = []
            for previous in reversed(current):
                if count(" ".join([previous, *carried])) > overlap_budget:
                    break
                carried.insert(0, previous)
            current = [*carried, sentence]
        else:
            current = candidate

    if current:
        pieces.append(" ".join(current))

    return pieces


def chunk_document(
    text: str,
    *,
    doc_type: str = "other",
    count_tokens: Callable[[str], int],
) -> list[Chunk]:
    """Text in, retrieval units out."""
    target, maximum = TARGETS.get(doc_type, TARGETS["other"])
    sections = split_into_sections(text)

    chunks: list[Chunk] = []
    pending: Section | None = None

    def flush(section: Section) -> None:
        body = section.text
        if not body:
            return

        if count_tokens(body) <= maximum:
            chunks.append(
                Chunk(
                    ordinal=len(chunks),
                    heading_path=list(section.heading_path),
                    content=body,
                    token_count=count_tokens(body),
                )
            )
            return

        for piece in split_oversized(body, max_tokens=maximum, count=count_tokens):
            chunks.append(
                Chunk(
                    ordinal=len(chunks),
                    heading_path=list(section.heading_path),
                    content=piece,
                    token_count=count_tokens(piece),
                )
            )

    for section in sections:
        if pending is None:
            pending = section
            continue

        # Merge a small section into its predecessor only when they share a
        # parent. Merging across branches would attach one heading path to
        # text that belongs under another, which is worse than a short chunk.
        combined_tokens = count_tokens(pending.text) + count_tokens(section.text)
        siblings = pending.heading_path[:-1] == section.heading_path[:-1]

        if siblings and combined_tokens <= target:
            pending = Section(
                heading_path=pending.heading_path,
                lines=[pending.text, section.text],
            )
        else:
            flush(pending)
            pending = section

    if pending is not None:
        flush(pending)

    return chunks


def context_header(
    *,
    title: str,
    heading_path: list[str],
    property_scope: str = "All properties",
    effective: str | None = None,
) -> str:
    """The §43.2 header, prepended before embedding.

    "The single highest-impact retrieval improvement available, and it costs
    almost nothing." Without it a chunk about noise embeds as generic text
    about noise; with it, as *the after-hours noise escalation procedure*.

    Stored alongside the chunk rather than rebuilt later, because it is what
    was actually embedded and a regenerated version would silently diverge
    from the vector it produced.
    """
    document_line = f"Document: {title}"
    if effective:
        document_line += f" (effective {effective})"

    section = " > ".join(heading_path) if heading_path else "(document root)"

    return "\n".join(
        [document_line, f"Property: {property_scope}", f"Section: {section}", "---"]
    )
