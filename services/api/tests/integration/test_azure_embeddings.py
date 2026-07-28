"""The real Azure OpenAI adapter, against the real endpoint.

**Opt-in.** These call a paid external service, so they run only when Azure
credentials are present and are excluded from CI, which has none. That is a
deliberate exception to the "tests must not skip" rule, which exists for the
tenant isolation suite — a suite that silently skips is not a control. This one
is a smoke test for a third party, and the alternative to skipping it is either
committing a key to CI or not having it at all.

What it proves that no unit test can: that the vectors carry **meaning**.
`FakeEmbeddings` is deterministic and normalised and would pass every
structural assertion in `test_embeddings.py` — and would fail every assertion
here, because a hash has no semantics. This is the file that would catch a
misconfigured deployment returning plausible-looking nonsense.
"""

from __future__ import annotations

import math

import pytest

from soyl.infrastructure.providers.azure_openai import AzureOpenAIEmbeddings
from soyl.settings import Settings

pytestmark = pytest.mark.azure


@pytest.fixture(scope="module")
def provider() -> AzureOpenAIEmbeddings:
    settings = Settings()  # type: ignore[call-arg]

    if not (settings.azure_openai_endpoint and settings.azure_openai_api_key):
        pytest.skip("Azure credentials absent; run with SOYL_AZURE_OPENAI_* set")

    return AzureOpenAIEmbeddings(
        endpoint=str(settings.azure_openai_endpoint),
        api_key=settings.azure_openai_api_key,
        deployment=settings.azure_openai_embedding_deployment,
        model=settings.azure_openai_embedding_model,
        dimensions=settings.embedding_dimensions,
        api_version=settings.azure_openai_api_version,
    )


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b, strict=True))


async def test_dimensions_match_the_column(provider: AzureOpenAIEmbeddings) -> None:
    """A mismatch fails on every single write, which is a bad way to find out."""
    result = await provider.embed(["a hotel cancellation policy"])

    assert len(result.vectors[0]) == 1536


async def test_usage_comes_back_for_the_ledger(provider: AzureOpenAIEmbeddings) -> None:
    result = await provider.embed(["a hotel cancellation policy"])

    assert result.usage.provider == "azure_openai"
    assert result.usage.model == "text-embedding-3-small"
    assert result.usage.input_tokens > 0
    # §6.6: every model call must be attributable to a cost.
    assert provider.cost_inr(result.usage.input_tokens) > 0


async def test_related_text_is_closer_than_unrelated_text(
    provider: AzureOpenAIEmbeddings,
) -> None:
    """The assertion the fake provider cannot pass.

    If retrieval is ever quietly pointed at hash vectors — a missing
    credential, a fallback nobody noticed — this is what fails. Everything
    structural would still look fine.
    """
    related_a, related_b, unrelated = (
        await provider.embed(
            [
                "What is our cancellation policy for corporate bookings?",
                "Corporate reservations may be cancelled without penalty up to 48 hours before arrival.",
                "The kitchen extractor fans are serviced every six months.",
            ]
        )
    ).vectors

    assert cosine(related_a, related_b) > cosine(related_a, unrelated)


async def test_the_vocabulary_gap_is_closed_by_meaning_not_words(
    provider: AzureOpenAIEmbeddings,
) -> None:
    """§43.2's premise, checked.

    Users ask "can I cancel free?"; the document says "cancellation without
    penalty". They share almost no words. If embeddings did not bridge that,
    the hypothetical-question index would be doing all the work.
    """
    question, document, decoy = (
        await provider.embed(
            [
                "can I cancel for free?",
                "Cancellation without penalty is permitted within the stated notice period.",
                "Breakfast is served between 7am and 10:30am in the atrium.",
            ]
        )
    ).vectors

    assert cosine(question, document) > cosine(question, decoy)


async def test_vectors_are_normalised(provider: AzureOpenAIEmbeddings) -> None:
    """The HNSW index uses cosine distance.

    OpenAI returns unit vectors; asserting it means a provider change that does
    not is caught here rather than as quietly degraded ranking.
    """
    (vector,) = (await provider.embed(["some hotel policy text"])).vectors

    assert math.isclose(math.sqrt(sum(v * v for v in vector)), 1.0, rel_tol=1e-3)


async def test_order_is_preserved_across_a_batch(provider: AzureOpenAIEmbeddings) -> None:
    """Azure returns items with an index, and the adapter re-sorts by it.

    Trusting arrival order would pair chunks with the wrong vectors — a corpus
    that looks healthy and retrieves nonsense.
    """
    texts = [f"Policy section number {index} about housekeeping." for index in range(10)]
    batch = await provider.embed(texts)

    for index, text in enumerate(texts):
        alone = (await provider.embed([text])).vectors[0]
        assert cosine(batch.vectors[index], alone) > 0.99
