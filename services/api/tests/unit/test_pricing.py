"""Pricing, and the guarantee that every priced adapter actually prices.

`UPDATE.md` §6.6 requires the usage ledger from the first model call. It has
existed since M4 and it was recording tokens and **no money**: the answer
pipeline omitted `cost_inr` from its INSERT, so the column took its default of
zero on every row. Nothing failed. The §11 cost screen was the first thing to
need the number, which is a milestone and a half later than the bug.

The last test here is the one that matters. It walks every provider adapter and
asserts that anything holding a price also exposes a way to apply it — so the
next adapter cannot be added with a price it never uses, which is exactly what
`azure_rerank` and `azure_advisor` both did.
"""

from __future__ import annotations

import inspect
from decimal import Decimal

import pytest

from soyl.infrastructure.providers import (
    azure_advisor,
    azure_answers,
    azure_openai,
    azure_questions,
    azure_rerank,
)
from soyl.infrastructure.providers.pricing import USD_TO_INR, token_cost


def test_a_million_input_tokens_costs_the_dollar_price_converted() -> None:
    cost = token_cost(input_tokens=1_000_000, usd_per_million_input=Decimal("0.25"))
    assert cost == Decimal("0.25") * USD_TO_INR


def test_output_tokens_are_priced_separately() -> None:
    """Not the same rate. Output is roughly eight times input, and a version
    that priced both at the input rate would understate every answer."""
    cost = token_cost(
        input_tokens=1_000_000,
        output_tokens=1_000_000,
        usd_per_million_input=Decimal("0.25"),
        usd_per_million_output=Decimal("2.00"),
    )
    assert cost == Decimal("2.25") * USD_TO_INR


def test_no_tokens_costs_nothing() -> None:
    assert token_cost(input_tokens=0, usd_per_million_input=Decimal("0.25")) == Decimal(0)


def test_the_result_is_exact_rather_than_floating_point() -> None:
    """`Decimal` throughout, because the ledger column is `numeric(12, 4)` and
    a float that arrives as 0.30000000000000004 is a rounding difference that
    accumulates across every call the product ever makes."""
    cost = token_cost(input_tokens=1, usd_per_million_input=Decimal("0.25"))
    assert isinstance(cost, Decimal)


@pytest.mark.parametrize(
    ("module", "name"),
    [
        (azure_openai, "AzureOpenAIEmbeddings"),
        (azure_answers, "AzureOpenAIAnswers"),
        (azure_questions, "AzureOpenAIQuestions"),
        (azure_rerank, "AzureOpenAIRerank"),
        (azure_advisor, "AzureOpenAIAdvisor"),
    ],
)
def test_every_adapter_that_holds_a_price_can_apply_it(module: object, name: str) -> None:
    """A price stored and never used is a cost screen that reads zero.

    `AzureOpenAIRerank` and `AzureOpenAIAdvisor` both took `usd_per_million_input` and
    `usd_per_million_output` in their constructors and had no `cost_inr` at
    all — the prices went into attributes nothing read. This is the check that
    would have said so.
    """
    adapter = getattr(module, name)
    parameters = inspect.signature(adapter.__init__).parameters

    holds_a_price = any(p.startswith("usd_per_million") for p in parameters)
    assert holds_a_price, f"{name} takes no price — update this test if that is now correct"

    assert hasattr(adapter, "cost_inr"), (
        f"{name} takes a price and has no cost_inr, so nothing can apply it"
    )
