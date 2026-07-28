"""A deterministic question generator, for tests and local development.

Imports nothing, like `FakeEmbeddings`. The questions are built from the
heading path rather than from meaning, which is enough to prove the pipeline
stores and embeds them against the right chunks — and useless for judging
whether they are good questions. That judgement belongs to the opt-in Azure
tests, and ultimately to M4's measured recall.
"""

from __future__ import annotations

from decimal import Decimal

from soyl.domain.ai.ports import QuestionResult, Usage

PROVIDER = "fake"


class FakeQuestions:
    """Implements `QuestionProvider` with no I/O."""

    def __init__(self, *, model: str = "fake-questions-v1") -> None:
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    def cost_inr(self, input_tokens: int, output_tokens: int = 0) -> Decimal:
        return Decimal(0)

    async def generate(self, *, context_header: str, content: str, count: int) -> QuestionResult:
        # The Section line of the header is the most question-like material
        # available without a model.
        section = ""
        for line in context_header.splitlines():
            if line.startswith("Section:"):
                section = line.removeprefix("Section:").strip()

        subject = section.split(">")[-1].strip() or content.strip()[:40]
        templates = [
            f"What is our policy on {subject}?",
            f"How do we handle {subject}?",
            f"Who is responsible for {subject}?",
            f"When does {subject} apply?",
        ]

        return QuestionResult(
            questions=templates[:count],
            usage=Usage(
                provider=PROVIDER,
                model=self._model,
                input_tokens=len(content) // 4,
                output_tokens=count * 8,
            ),
        )
