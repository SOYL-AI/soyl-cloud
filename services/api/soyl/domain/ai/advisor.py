"""The public Hotel Advisor.

A visitor arrives on the marketing site, answers a few questions about their
property, and gets something useful back before signing up.

**It is not RAG, and it must never pretend to be.** An anonymous visitor has no
tenant and no corpus, so there is nothing to retrieve and nothing to cite. The
authenticated product answers *from your documents*; this answers *from what
you just told us*. Blurring that would mean fabricating authority on the
landing page, which is the single worst place to do it — it is the first thing
a prospect checks and the first thing they would catch us on.

So the guarantees here are different from the answer pipeline's, and are
enforced differently:

- No `doc.citation` blocks. There are no documents.
- **No invented figures.** The prompt forbids statistics, benchmarks and
  percentages, and `strip_invented_figures` removes them deterministically
  afterwards, because a prompt is a request and a validator is a rule. "Hotels
  your size typically lose 12% of revenue to manual processes" is exactly the
  sentence a model will produce unprompted and exactly the one that would make
  a hotelier stop trusting us.
- Everything it says is traceable to an answer the visitor gave.

What it *can* do honestly is reflect a situation back with more structure than
the person had, and name specifically what would change. That is a real thing
to offer and it does not require pretending to know their numbers.
"""

from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, Field

# Kept in the domain so the API, the prompt and the web form cannot disagree
# about what was asked. A question added on one side only would produce answers
# nobody can interpret.
QUESTIONS: list[dict[str, object]] = [
    {
        "key": "property_type",
        "prompt": "What kind of property do you run?",
        "options": [
            "Independent hotel",
            "Small group (2-10 properties)",
            "Resort",
            "Serviced apartments",
            "Boutique / heritage",
        ],
    },
    {
        "key": "rooms",
        "prompt": "Roughly how many rooms in total?",
        "options": ["Under 25", "25-60", "60-150", "150-400", "More than 400"],
    },
    {
        "key": "team",
        "prompt": "How many people would be asking questions of your documents?",
        "options": ["Just me", "2-5", "6-20", "More than 20"],
    },
    {
        "key": "pain",
        "prompt": "What takes the most time that probably shouldn't?",
        "options": [
            "Answering the same staff questions repeatedly",
            "Finding the right clause in a contract",
            "Training new staff on our procedures",
            "Keeping SOPs current across properties",
            "Something else",
        ],
    },
    {
        "key": "detail",
        "prompt": "Anything specific you'd want it to answer on day one?",
        "options": [],
    },
]

ANSWER_KEYS = frozenset(str(question["key"]) for question in QUESTIONS)


class AdvisorAnswers(BaseModel):
    """What the visitor told us. Every field optional — they may stop early."""

    model_config = ConfigDict(extra="forbid")

    property_type: str | None = Field(default=None, max_length=120)
    rooms: str | None = Field(default=None, max_length=60)
    team: str | None = Field(default=None, max_length=60)
    pain: str | None = Field(default=None, max_length=200)
    detail: str | None = Field(default=None, max_length=600)

    def filled(self) -> dict[str, str]:
        return {
            key: value
            for key, value in self.model_dump().items()
            if isinstance(value, str) and value.strip()
        }


class AdvisorBlock(BaseModel):
    """Deliberately narrower than the envelope's block.

    Three types, and `doc.citation` is not one of them — the type system says
    what the prose promises, so a citation cannot appear here even by mistake.
    """

    model_config = ConfigDict(extra="forbid")

    type: str = Field(pattern="^(text.markdown|list.checklist|alert.callout)$")
    title: str | None = None
    markdown: str | None = None
    level: str | None = None
    items: list[str] = Field(default_factory=list)


class AdvisorInsight(BaseModel):
    model_config = ConfigDict(extra="forbid")

    headline: str
    blocks: list[AdvisorBlock] = Field(default_factory=list)


# Anything shaped like a claimed measurement. Deliberately broad: a false
# positive costs a sentence, a false negative costs credibility.
_FIGURE = re.compile(
    r"""
    \b\d+(?:\.\d+)?\s?%                      # 12%, 3.5 %
    # No \b before the symbols: a word boundary requires a word character
    # adjacent, and "₹" is not one — so "Saves ₹50,000" never matched and every
    # currency amount passed straight through. Caught by the unit test, which
    # is the only reason it is not still true.
    | (?:[₹$]|\b(?:rs\.?|inr|usd)\b)\s?\d[\d,.]*
    | \b\d+\s?(?:x|times)\s+(?:more|less|faster|higher|lower)
    | \b\d[\d,.]*\s+(?:hours?|minutes?)\s+(?:per|a|each)\s+\w+
    """,
    re.IGNORECASE | re.VERBOSE,
)


def strip_invented_figures(text: str, *, allowed: set[str]) -> str:
    """Remove any figure the visitor did not give us.

    The prompt already forbids them. This exists because a prompt is a request
    and this is a rule — and because the failure is silent: a plausible
    benchmark reads as expertise, and the person best placed to notice it is
    wrong is the hotelier we are trying to earn.

    `allowed` holds the visitor's own answers, so "25-60 rooms" survives being
    quoted back at them.
    """

    def replace(match: re.Match[str]) -> str:
        figure = match.group(0)
        if any(figure.strip() in value for value in allowed):
            return figure
        return "—"

    return _FIGURE.sub(replace, text)


def sanitise(insight: AdvisorInsight, *, answers: AdvisorAnswers) -> AdvisorInsight:
    """Apply the figure rule to everything the model wrote."""
    allowed = set(answers.filled().values())

    return AdvisorInsight(
        headline=strip_invented_figures(insight.headline, allowed=allowed),
        blocks=[
            AdvisorBlock(
                type=block.type,
                title=block.title,
                markdown=(
                    strip_invented_figures(block.markdown, allowed=allowed)
                    if block.markdown
                    else None
                ),
                level=block.level,
                items=[strip_invented_figures(item, allowed=allowed) for item in block.items],
            )
            for block in insight.blocks
            # A citation type cannot reach here through the schema, but a
            # block with no content still can, and an empty card is worse than
            # one fewer card.
            if (block.markdown and block.markdown.strip()) or block.items
        ],
    )
