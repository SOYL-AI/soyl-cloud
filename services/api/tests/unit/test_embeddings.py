"""The embedding seam.

Tested through `FakeEmbeddings` because the properties that matter are the
port's, not any provider's: order preservation, dimensionality, determinism,
and that usage comes back attached rather than being the caller's job to
remember.
"""

from __future__ import annotations

import math

import pytest

from soyl.domain.ai.ports import EmbeddingResult, ProviderError, Usage
from soyl.infrastructure.providers.fake import FakeEmbeddings


@pytest.fixture
def provider() -> FakeEmbeddings:
    return FakeEmbeddings(dimensions=1536)


async def test_one_vector_per_input_in_order(provider: FakeEmbeddings) -> None:
    result = await provider.embed(["first", "second", "third"])

    assert len(result.vectors) == 3
    # Misalignment here would pair every chunk with the wrong vector, and the
    # corpus would look healthy while retrieving nonsense.
    assert result.vectors[0] == (await provider.embed(["first"])).vectors[0]
    assert result.vectors[2] == (await provider.embed(["third"])).vectors[0]


async def test_dimensions_match_the_column(provider: FakeEmbeddings) -> None:
    # A mismatch fails at the database rather than here, but it fails on every
    # single write, which is a bad way to find out.
    result = await provider.embed(["anything"])

    assert len(result.vectors[0]) == provider.dimensions == 1536


async def test_the_same_text_always_embeds_identically(provider: FakeEmbeddings) -> None:
    first = await provider.embed(["Guest complaint handling SOP"])
    second = await provider.embed(["Guest complaint handling SOP"])

    assert first.vectors == second.vectors


async def test_different_text_embeds_differently(provider: FakeEmbeddings) -> None:
    result = await provider.embed(["cancellation policy", "laundry vendor terms"])

    assert result.vectors[0] != result.vectors[1]


async def test_vectors_are_normalised(provider: FakeEmbeddings) -> None:
    """The index uses cosine distance.

    Unnormalised vectors would let magnitude — an artefact of the hash here,
    and of text length with a real provider — influence ranking.
    """
    (vector,) = (await provider.embed(["some text"])).vectors

    assert math.isclose(math.sqrt(sum(v * v for v in vector)), 1.0, rel_tol=1e-9)


async def test_usage_comes_back_attached(provider: FakeEmbeddings) -> None:
    """§6.6 requires a ledger row for every model call.

    Returning usage as part of the result rather than leaving the caller to
    ask for it is what makes forgetting to record it awkward.
    """
    result = await provider.embed(["a" * 400])

    assert result.usage.provider == "fake"
    assert result.usage.model == provider.model
    assert result.usage.input_tokens > 0
    assert result.usage.units == 1


async def test_an_empty_batch_is_not_an_error(provider: FakeEmbeddings) -> None:
    # A document that chunked to nothing should not crash the worker.
    result = await provider.embed([])

    assert result.vectors == []


def test_an_empty_vector_is_rejected_at_construction() -> None:
    """A provider returning [] for an input is a silent corpus corruption.

    Caught in the result type so no adapter can pass one on, whatever it
    received.
    """
    with pytest.raises(ProviderError, match="empty embedding"):
        EmbeddingResult(vectors=[[0.1, 0.2], []], usage=Usage(provider="x", model="y"))
