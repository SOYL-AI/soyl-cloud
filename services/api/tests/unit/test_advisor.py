"""The advisor's figure sanitiser.

The public advisor has no documents, so it has no provenance mechanism. The one
thing that can be checked deterministically is whether it stated a number, and
that is the failure worth catching: "hotels your size typically lose 12% of
revenue to manual processes" is exactly the sentence a model produces unasked,
and exactly the one a hotelier will know is wrong.

It runs on the marketing site, in front of people deciding whether to trust us
at all, which is the worst possible place to be caught inventing data.
"""

from __future__ import annotations

from soyl.domain.ai.advisor import (
    AdvisorAnswers,
    AdvisorBlock,
    AdvisorInsight,
    sanitise,
    strip_visitor_specific_figures,
)


def test_a_percentage_we_were_never_given_is_removed() -> None:
    text = "Hotels your size typically lose 12% of revenue to manual lookups."

    assert "12%" not in strip_visitor_specific_figures(text, allowed=set())


def test_a_currency_amount_is_removed() -> None:
    for text in ["This saves you about ₹40,000 a month.", "Roughly $2,000 of your staff time."]:
        cleaned = strip_visitor_specific_figures(text, allowed=set())
        assert "40,000" not in cleaned
        assert "2,000" not in cleaned


def test_a_time_saving_claim_is_removed() -> None:
    text = "You would get back 6 hours per week."

    assert "6 hours" not in strip_visitor_specific_figures(text, allowed=set())


def test_a_multiplier_claim_is_removed() -> None:
    text = "Your staff find answers 3x faster."

    assert "3x faster" not in strip_visitor_specific_figures(text, allowed=set())


def test_the_visitor_s_own_numbers_survive() -> None:
    """Quoting someone's answer back is the whole point of the feature.

    Stripping "25-60" from "a 25-60 room property" would make the insight read
    as though we had not listened, which is worse than saying nothing.
    """
    text = "A 25-60 room property with 2-5 people asking questions."
    allowed = {"25-60", "2-5"}

    assert strip_visitor_specific_figures(text, allowed=allowed) == text


def test_prose_without_figures_is_untouched() -> None:
    text = "Finding the right clause means somebody opens a PDF and scrolls."

    assert strip_visitor_specific_figures(text, allowed=set()) == text


def test_sanitise_covers_headline_items_and_markdown() -> None:
    """Every field the model writes, not just the obvious one.

    A checklist item is as visible as a paragraph, and a headline more so.
    """
    insight = AdvisorInsight(
        headline="Properties like yours waste 30% of a shift.",
        blocks=[
            AdvisorBlock(type="text.markdown", markdown="Saves you ₹50,000 a month."),
            AdvisorBlock(
                type="list.checklist",
                items=["Cut your onboarding by 40%", "What is our cancellation policy?"],
            ),
        ],
    )

    cleaned = sanitise(insight, answers=AdvisorAnswers(rooms="25-60"))

    assert "30%" not in cleaned.headline
    assert "50,000" not in (cleaned.blocks[0].markdown or "")
    assert "40%" not in cleaned.blocks[1].items[0]
    assert cleaned.blocks[1].items[1] == "What is our cancellation policy?"


def test_an_empty_block_is_dropped_rather_than_rendered_blank() -> None:
    insight = AdvisorInsight(
        headline="A small property.",
        blocks=[
            AdvisorBlock(type="text.markdown", markdown="   "),
            AdvisorBlock(type="text.markdown", markdown="Real content."),
        ],
    )

    cleaned = sanitise(insight, answers=AdvisorAnswers())

    assert len(cleaned.blocks) == 1


def test_the_advisor_cannot_produce_a_citation_block() -> None:
    """Enforced by the type, not by the prompt.

    The public advisor has no documents. A `doc.citation` here would be a
    fabricated source on the landing page — so the schema refuses it rather
    than the prompt discouraging it.
    """
    import pydantic
    import pytest

    with pytest.raises(pydantic.ValidationError):
        AdvisorBlock(type="doc.citation", markdown="From your SOP.")
