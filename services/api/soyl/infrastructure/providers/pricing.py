"""What a model call costs, in rupees.

One function, because there were four near-identical copies of it and two
adapters that stored a price and never used it — which is how
`billing.usage_ledger` came to record tokens and no money for every answer
between M4 and M6.

Rupees rather than dollars because `UPDATE.md` prices in rupees and migration
005 stores `cost_inr`. The conversion happens **at write time**, on purpose:
the rate moves, and a ledger converted at read time would silently restate
last month's costs every time it did.
"""

from __future__ import annotations

from decimal import Decimal

MILLION = Decimal(1_000_000)

# One place, so a rate change is one edit rather than five. A default rather
# than a setting because it is a rounding-level input to an internal cost
# screen, not a number anyone is billed against — when that stops being true it
# becomes a settings field and this comment is the reason to move it.
USD_TO_INR = Decimal("88")


def token_cost(
    *,
    input_tokens: int,
    output_tokens: int = 0,
    usd_per_million_input: Decimal,
    usd_per_million_output: Decimal = Decimal(0),
    usd_to_inr: Decimal = USD_TO_INR,
) -> Decimal:
    """Price one call. Keyword-only, so input and output prices cannot swap.

    They are the same type and differ by roughly 8x, so a positional call that
    transposed them would produce a plausible number and no error at all.
    """
    return (
        Decimal(input_tokens) / MILLION * usd_per_million_input
        + Decimal(output_tokens) / MILLION * usd_per_million_output
    ) * usd_to_inr
