"""Measuring the answer pipeline, not just retrieval.

`evals/harness.py` measures whether the right chunks come back. This measures
what happens next, against the two `UPDATE.md` §M4 acceptance criteria that
retrieval alone cannot demonstrate:

> every answer carries working citations; and asking something genuinely not
> covered by the corpus produces an honest "I don't have that" rather than a
> confident invention. **Test the last one deliberately and often.**

The second is the one that matters and the one that is hard. The retrieval eval
already showed the shape of the problem: for a question the corpus does not
cover, retrieval hands back one or two weakly related chunks rather than
nothing. So the synthesiser is the last line of defence, and this file exists
to find out whether it holds.

Three numbers come out of it:

- **Answer rate** — of questions the corpus does answer, how many produced an
  answer. A pipeline that refuses everything scores perfectly on honesty and is
  worthless.
- **Refusal rate** — of probes the corpus does not answer, how many were
  refused. This is the number to watch.
- **Citation integrity** — every citation on every answer points at a chunk
  that was actually retrieved for that turn, checked against the database
  rather than against the envelope's own claims.

The first two are in tension by design, which is why both are reported. Moving
one without the other is not an improvement.
"""

from __future__ import annotations

import asyncio
import statistics
import uuid
from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.sql import text

from evals.harness import Probe, Question
from soyl.application.ai.answer import answer_question
from soyl.domain.ai.ports import AnswerProvider, EmbeddingProvider, ProviderError, RerankProvider
from soyl.infrastructure.db.session import tenant_session


@dataclass(frozen=True, slots=True)
class Answered:
    question_id: str
    text: str
    status: str
    headline: str
    blocks: int
    citations: int
    stripped: int
    # Citations pointing at a chunk the retrieval log does not contain. Should
    # always be zero — the validator runs before persistence — so a non-zero
    # value means the validator has a hole rather than the model has a quirk.
    unbacked: int
    cost_inr: float
    error: str | None = None

    @property
    def refused(self) -> bool:
        return self.status in ("no_evidence", "refused")


@dataclass
class AnswerReport:
    answers: list[Answered] = field(default_factory=list)
    refusals: list[Answered] = field(default_factory=list)

    @property
    def answer_rate(self) -> float:
        """Of questions the corpus covers, how many were answered."""
        if not self.answers:
            return 0.0
        return len([a for a in self.answers if not a.refused]) / len(self.answers)

    @property
    def refusal_rate(self) -> float:
        """Of probes the corpus does not cover, how many were refused.

        §M4's "test this deliberately and often" criterion, as a number.
        """
        if not self.refusals:
            return 0.0
        return len([a for a in self.refusals if a.refused]) / len(self.refusals)

    @property
    def citation_integrity(self) -> float:
        answered = [a for a in self.answers if not a.refused]
        if not answered:
            return 0.0
        return len([a for a in answered if a.unbacked == 0]) / len(answered)

    @property
    def uncited_answers(self) -> int:
        """Answers with blocks but no sources at all.

        Not a validator failure — an alert-only answer is legitimately
        uncited — but on a question the corpus *does* cover it means the
        synthesiser wrote prose it could not support and the validator removed
        all of it.
        """
        return len([a for a in self.answers if not a.refused and a.citations == 0])

    @property
    def mean_cost_inr(self) -> float:
        costs = [a.cost_inr for a in self.answers + self.refusals]
        return statistics.fmean(costs) if costs else 0.0

    @property
    def total_stripped(self) -> int:
        return sum(a.stripped for a in self.answers + self.refusals)


async def _ask_one(
    factory: async_sessionmaker[AsyncSession],
    *,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    embeddings: EmbeddingProvider,
    answers: AnswerProvider,
    reranker: RerankProvider | None,
    question_id: str,
    question: str,
    pace: float,
) -> Answered:
    if pace:
        await asyncio.sleep(pace)

    try:
        outcome = await answer_question(
            factory,
            embeddings=embeddings,
            answers=answers,
            reranker=reranker,
            tenant_id=tenant_id,
            user_id=user_id,
            question=question,
        )
    except ProviderError as error:
        return Answered(
            question_id=question_id,
            text=question,
            status="failed",
            headline="",
            blocks=0,
            citations=0,
            stripped=0,
            unbacked=0,
            cost_inr=0.0,
            error=str(error),
        )

    envelope = outcome.envelope

    # Checked against the retrieval log rather than the envelope, because the
    # envelope is the thing under test. Asking it to confirm its own citations
    # would prove only that it is internally consistent.
    async with tenant_session(factory, tenant_id) as session:
        row = (
            await session.execute(
                text("SELECT chunk_ids FROM ai.retrieval_log WHERE turn_id = :id"),
                {"id": outcome.turn_id},
            )
        ).scalar_one_or_none()

    retrieved = {uuid.UUID(str(chunk_id)) for chunk_id in (row or [])}
    unbacked = len(envelope.cited_chunk_ids - retrieved)

    return Answered(
        question_id=question_id,
        text=question,
        status=envelope.status,
        headline=envelope.summary.headline,
        blocks=len(envelope.blocks),
        citations=len(envelope.provenance.documents),
        stripped=envelope.diagnostics.stripped_blocks,
        unbacked=unbacked,
        cost_inr=float(envelope.diagnostics.usage.cost_inr),
    )


async def run_answers(
    factory: async_sessionmaker[AsyncSession],
    *,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    embeddings: EmbeddingProvider,
    answers: AnswerProvider,
    reranker: RerankProvider | None,
    questions: list[Question],
    probes: list[Probe],
    pace: float = 6.0,
) -> AnswerReport:
    report = AnswerReport()

    for question in questions:
        report.answers.append(
            await _ask_one(
                factory,
                tenant_id=tenant_id,
                user_id=user_id,
                embeddings=embeddings,
                answers=answers,
                reranker=reranker,
                question_id=question.id,
                question=question.text,
                pace=pace,
            )
        )

    for probe in probes:
        report.refusals.append(
            await _ask_one(
                factory,
                tenant_id=tenant_id,
                user_id=user_id,
                embeddings=embeddings,
                answers=answers,
                reranker=reranker,
                question_id=probe.id,
                question=probe.text,
                pace=pace,
            )
        )

    return report


def render_answers(report: AnswerReport) -> str:
    lines: list[str] = []
    add = lines.append

    add("")
    add("── answers ──────────────────────────────────────────────────────────")
    add(f"  answer rate       {report.answer_rate:.3f}   "
        f"({len([a for a in report.answers if not a.refused])}/{len(report.answers)} "
        f"covered questions answered)")
    add(f"  refusal rate      {report.refusal_rate:.3f}   "
        f"({len([a for a in report.refusals if a.refused])}/{len(report.refusals)} "
        f"uncovered questions refused)")
    add(f"  citation integrity {report.citation_integrity:.3f}  "
        f"(answers whose every citation was actually retrieved)")
    add(f"  blocks stripped   {report.total_stripped}")
    add(f"  uncited answers   {report.uncited_answers}")
    add(f"  mean cost         ₹{report.mean_cost_inr:.4f}")
    add("")

    # The expensive failure: a confident answer to a question the corpus does
    # not cover. Listed in full, because each one is a specific thing to fix
    # rather than a number to improve.
    invented = [a for a in report.refusals if not a.refused]
    if invented:
        add(f"ANSWERED WHAT IT SHOULD HAVE REFUSED ({len(invented)}):")
        for item in invented:
            add(f"  {item.question_id}  {item.text}")
            add(f"      -> {item.headline}")
            add(f"         {item.citations} citation(s), {item.blocks} block(s)")
        add("")

    silent = [a for a in report.answers if a.refused]
    if silent:
        add(f"refused a question the corpus does answer ({len(silent)}):")
        for item in silent:
            add(f"  {item.question_id}  {item.text}")
        add("")

    unbacked = [a for a in report.answers + report.refusals if a.unbacked]
    if unbacked:
        add(f"!! CITATIONS NOT IN THE RETRIEVAL LOG ({len(unbacked)}) — validator hole:")
        for item in unbacked:
            add(f"  {item.question_id}  {item.unbacked} unbacked")
        add("")

    failed = [a for a in report.answers + report.refusals if a.error]
    if failed:
        add(f"provider failures ({len(failed)}):")
        for item in failed:
            add(f"  {item.question_id}  {item.error}")

    return "\n".join(lines)
