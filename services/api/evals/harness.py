"""Measuring retrieval against the labelled set.

    ingest the corpus → run every question → score

`UPDATE.md` §M4 accepts retrieval at recall@10 ≥ 0.85 and precision@5 ≥ 0.70.
Both are computed here, along with the probe pass rate, which is not in the
acceptance numbers and is the one worth watching most closely: it measures
whether the system will say "I don't have that".

**Labels are resolved, not assumed.** A question names a section of a document;
this module finds the chunk carrying that section and raises if there isn't
one. The alternative — treating an unresolvable label as "not retrieved" — is
the failure this design exists to prevent, because a renamed heading would then
look like a retrieval regression and send someone to debug the retriever.
"""

from __future__ import annotations

import asyncio
import statistics
import tomllib
import uuid
from collections.abc import Sequence
from dataclasses import dataclass, field
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from soyl.application.rag.retrieve import retrieve
from soyl.domain.ai.ports import EmbeddingProvider, RerankProvider
from soyl.infrastructure.db.session import tenant_session

EVALS = Path(__file__).parent
CORPUS = EVALS / "corpus"
QUESTIONS = EVALS / "questions.toml"

# §M4's numbers. Named here so a run reports pass or fail rather than leaving
# the reader to compare against a document.
TARGET_RECALL_AT_10 = 0.85
TARGET_PRECISION_AT_5 = 0.70


class LabelError(Exception):
    """A label does not correspond to anything in the ingested corpus."""


@dataclass(frozen=True, slots=True)
class Label:
    document: str
    section: str

    def __str__(self) -> str:
        return f"{self.document}#{self.section}"


@dataclass(frozen=True, slots=True)
class Question:
    id: str
    text: str
    answers: tuple[Label, ...]
    tags: tuple[str, ...] = ()
    note: str | None = None


@dataclass(frozen=True, slots=True)
class Probe:
    id: str
    text: str
    tags: tuple[str, ...] = ()
    note: str | None = None


def load_questions(path: Path = QUESTIONS) -> tuple[list[Question], list[Probe]]:
    data = tomllib.loads(path.read_text(encoding="utf-8"))

    questions = [
        Question(
            id=row["id"],
            text=row["text"],
            answers=tuple(
                Label(document=answer["document"], section=answer["section"])
                for answer in row["answers"]
            ),
            tags=tuple(row.get("tags", ())),
            note=row.get("note"),
        )
        for row in data.get("question", [])
    ]
    probes = [
        Probe(
            id=row["id"],
            text=row["text"],
            tags=tuple(row.get("tags", ())),
            note=row.get("note"),
        )
        for row in data.get("probe", [])
    ]
    return questions, probes


def resolve_labels(
    chunks: Sequence[tuple[uuid.UUID, str, list[str], str]],
    questions: Sequence[Question],
) -> dict[Label, set[uuid.UUID]]:
    """Map each label to the chunk ids that carry it.

    `chunks` is (chunk_id, document_title, heading_path, content) for the whole
    ingested corpus.

    A section resolves two ways, and it needs both. Usually it is a chunk's own
    leaf heading. But the chunker merges a small section into a sibling and
    re-emits the absorbed heading into the body, so a section can also live
    inside a chunk headed by its neighbour — which is exactly what happens to
    "Departure timings" and a third of the rest of this corpus.
    """
    resolved: dict[Label, set[uuid.UUID]] = {}
    wanted = {label for question in questions for label in question.answers}

    for label in wanted:
        matches = {
            chunk_id
            for chunk_id, title, heading_path, content in chunks
            if title == label.document
            and (
                (heading_path and heading_path[-1] == label.section)
                or f"# {label.section}" in content
            )
        }
        if not matches:
            raise LabelError(
                f"{label} matches no chunk. The heading was renamed, the document "
                f"was renamed, or the section no longer survives chunking. Fix the "
                f"label — do not let it score zero."
            )
        resolved[label] = matches

    return resolved


@dataclass(frozen=True, slots=True)
class QuestionScore:
    question: Question
    retrieved: list[uuid.UUID]
    relevant: set[uuid.UUID]
    reranked: bool
    # Everything the reranker scored, in its order, before the threshold cut
    # it. Carried so a miss can be attributed: a chunk that is here but not in
    # `retrieved` was found and rejected, which is a calibration failure, not a
    # retrieval one.
    considered: list[uuid.UUID] = field(default_factory=list)
    dropped_scores: dict[uuid.UUID, float] = field(default_factory=dict)

    @property
    def recall_at_10(self) -> float:
        """Of the chunks that answer this, how many surfaced in the top 10.

        Recall is what decides whether an answer is *possible*. A chunk that
        never reaches the model cannot be cited, so everything downstream is
        capped by this number.
        """
        if not self.relevant:
            return 0.0
        found = self.relevant & set(self.retrieved[:10])
        return len(found) / len(self.relevant)

    @property
    def precision_at_5(self) -> float:
        """Of the top 5, how many actually answer this.

        Precision decides whether the answer is *good*. Weak chunks in context
        dilute it and invite the model to reach for a marginally relevant
        policy — §45.3's reason for the score threshold.

        Divided by the number of relevant chunks where that is fewer than five,
        rather than by five. A question with one correct chunk cannot score
        above 0.2 against a flat denominator, and averaging that across a set
        where most questions have one answer produces a ceiling of 0.2 that no
        pipeline could ever clear.
        """
        top = self.retrieved[:5]
        if not top:
            return 0.0
        hits = len([chunk_id for chunk_id in top if chunk_id in self.relevant])
        return hits / min(5, len(self.relevant))

    @property
    def context_purity(self) -> float:
        """Of the chunks actually handed to the model, how many earn their place.

        The number `precision_at_5` above should have been, and is reported
        alongside it because the two answer different questions.

        `precision_at_5` divides by the number of relevant chunks, so on a
        question with one correct answer it reduces to "was it in the top 5" —
        which is recall by another name, and is why the two metrics move
        together on this set. It is the right shape for §M4's 0.70 target,
        because standard precision@5 against a single-answer question caps at
        0.2 and no pipeline could ever clear it.

        This one divides by what was returned. It is the dilution measure §45.3
        argues from — "returning 8 weak chunks is worse than returning 3 strong
        ones" — and unlike the other two it can be bad while retrieval is
        perfect, which is exactly when it is worth knowing.
        """
        top = self.retrieved[:5]
        if not top:
            # Nothing returned dilutes nothing. Counting this as 0 would punish
            # the honest "I don't have that" the product is built around.
            return 1.0
        return len([chunk_id for chunk_id in top if chunk_id in self.relevant]) / len(top)

    @property
    def recall_at_10_before_threshold(self) -> float:
        """What the retriever found, ignoring whether the threshold let it out.

        The gap between this and `recall_at_10` is the whole diagnosis. Equal
        numbers mean the retriever is the ceiling. A large gap means retrieval
        is working and the threshold is throwing away correct answers, which is
        a one-constant fix rather than a pipeline problem.
        """
        if not self.relevant:
            return 0.0
        return len(self.relevant & set(self.considered[:10])) / len(self.relevant)

    @property
    def rank_of_first_hit(self) -> int | None:
        for position, chunk_id in enumerate(self.retrieved, start=1):
            if chunk_id in self.relevant:
                return position
        return None


@dataclass(frozen=True, slots=True)
class ProbeScore:
    probe: Probe
    retrieved_count: int

    @property
    def passed(self) -> bool:
        """Correct behaviour is retrieving nothing at all."""
        return self.retrieved_count == 0


@dataclass
class Report:
    questions: list[QuestionScore] = field(default_factory=list)
    probes: list[ProbeScore] = field(default_factory=list)
    corpus_chunks: int = 0

    @property
    def recall_at_10(self) -> float:
        return statistics.fmean(score.recall_at_10 for score in self.questions)

    @property
    def precision_at_5(self) -> float:
        return statistics.fmean(score.precision_at_5 for score in self.questions)

    @property
    def recall_at_10_before_threshold(self) -> float:
        return statistics.fmean(
            score.recall_at_10_before_threshold for score in self.questions
        )

    @property
    def context_purity(self) -> float:
        return statistics.fmean(score.context_purity for score in self.questions)

    @property
    def mrr(self) -> float:
        """Mean reciprocal rank — how near the top the first correct chunk is.

        Not an acceptance number. It is here because it moves when recall and
        precision do not: a change that lifts the right chunk from rank 8 to
        rank 2 improves every answer and leaves both headline metrics flat.
        """
        return statistics.fmean(
            1.0 / score.rank_of_first_hit if score.rank_of_first_hit else 0.0
            for score in self.questions
        )

    @property
    def probe_pass_rate(self) -> float:
        if not self.probes:
            return 0.0
        return len([score for score in self.probes if score.passed]) / len(self.probes)

    @property
    def passed(self) -> bool:
        return (
            self.recall_at_10 >= TARGET_RECALL_AT_10
            and self.precision_at_5 >= TARGET_PRECISION_AT_5
        )

    def by_tag(self) -> dict[str, tuple[int, float, float]]:
        """Per-tag counts and averages.

        The aggregate hides the thing worth knowing. A pipeline can clear both
        targets while failing every `exact-identifier` question, and the fix for
        that is in a different retriever from the fix for a weak
        `vocabulary-gap` score.
        """
        tags = sorted({tag for score in self.questions for tag in score.question.tags})
        summary: dict[str, tuple[int, float, float]] = {}
        for tag in tags:
            group = [score for score in self.questions if tag in score.question.tags]
            summary[tag] = (
                len(group),
                statistics.fmean(score.recall_at_10 for score in group),
                statistics.fmean(score.precision_at_5 for score in group),
            )
        return summary


async def run(
    factory: async_sessionmaker[AsyncSession],
    *,
    tenant_id: uuid.UUID,
    embeddings: EmbeddingProvider,
    reranker: RerankProvider | None,
    questions: Sequence[Question],
    probes: Sequence[Probe],
    labels: dict[Label, set[uuid.UUID]],
    corpus_chunks: int = 0,
    pace: float = 2.0,
) -> Report:
    """Run every question and probe against an already-ingested corpus.

    `pace` is a delay between questions, and retries follow it. Both exist
    because of a rate limit, and neither belongs in the provider: on the
    request path a rerank that fails must fall back to fusion order
    immediately, since a guest is waiting. Here nobody is waiting, and a
    fallback silently invalidates the measurement — a run where a third of the
    questions skipped reranking reports a number for a pipeline we do not ship.

    That failure is worth guarding against explicitly, because it looks like a
    result rather than like an error.
    """
    report = Report(corpus_chunks=corpus_chunks)

    for question in questions:
        relevant: set[uuid.UUID] = set()
        for label in question.answers:
            relevant |= labels[label]

        # top_k is 10 so recall@10 is measurable at all. The product serves 8;
        # asking for 10 here measures the retriever rather than the context
        # budget, and precision@5 only reads the first five.
        result = await _retrieve_insisting_on_rerank(
            factory,
            tenant_id=tenant_id,
            embeddings=embeddings,
            reranker=reranker,
            query=question.text,
            pace=pace,
        )

        # Delivered first, then whatever the threshold rejected, which is the
        # order the reranker put them in.
        considered = [chunk.chunk_id for chunk in result.chunks]
        considered += [chunk_id for chunk_id, _ in result.dropped]

        report.questions.append(
            QuestionScore(
                question=question,
                retrieved=[chunk.chunk_id for chunk in result.chunks],
                relevant=relevant,
                reranked=result.reranked,
                considered=considered,
                dropped_scores=dict(result.dropped),
            )
        )

    for probe in probes:
        result = await _retrieve_insisting_on_rerank(
            factory,
            tenant_id=tenant_id,
            embeddings=embeddings,
            reranker=reranker,
            query=probe.text,
            pace=pace,
        )
        report.probes.append(ProbeScore(probe=probe, retrieved_count=len(result.chunks)))

    return report


async def _retrieve_insisting_on_rerank(
    factory: async_sessionmaker[AsyncSession],
    *,
    tenant_id: uuid.UUID,
    embeddings: EmbeddingProvider,
    reranker: RerankProvider | None,
    query: str,
    pace: float,
    attempts: int = 4,
):
    """Retrieve, retrying while the reranker is being rate limited.

    Returns the last result either way. A run that could not rerank everything
    still reports, and `render` prints the reranked count so the reader can see
    that the number in front of them is not the number they asked for.
    """
    delay = pace
    result = None
    for attempt in range(attempts):
        if attempt:
            await asyncio.sleep(delay)
            delay *= 2
        elif pace:
            await asyncio.sleep(pace)

        async with tenant_session(factory, tenant_id) as session:
            result = await retrieve(
                session,
                embeddings=embeddings,
                reranker=reranker,
                query=query,
                top_k=10,
            )
        if reranker is None or result.reranked:
            return result

    assert result is not None
    return result


def render(report: Report) -> str:
    """A run, as text, with the failures first."""
    lines: list[str] = []
    add = lines.append

    add(f"corpus: {report.corpus_chunks} chunks · {len(report.questions)} questions "
        f"· {len(report.probes)} probes")
    reranked = len([score for score in report.questions if score.reranked])
    add(f"reranked: {reranked}/{len(report.questions)}")
    add("")

    recall_mark = "PASS" if report.recall_at_10 >= TARGET_RECALL_AT_10 else "FAIL"
    precision_mark = "PASS" if report.precision_at_5 >= TARGET_PRECISION_AT_5 else "FAIL"
    add(f"  recall@10     {report.recall_at_10:.3f}   target {TARGET_RECALL_AT_10:.2f}   {recall_mark}")
    add(f"  precision@5   {report.precision_at_5:.3f}   target {TARGET_PRECISION_AT_5:.2f}   {precision_mark}")
    add(f"  MRR           {report.mrr:.3f}")
    add(f"  context purity           {report.context_purity:.3f}   "
        f"(share of returned chunks that earn their place)")
    add(f"  recall@10 pre-threshold  {report.recall_at_10_before_threshold:.3f}   "
        f"(what the retriever found before §45.3's cut)")
    add(f"  probes        {report.probe_pass_rate:.3f}   "
        f"({len([p for p in report.probes if p.passed])}/{len(report.probes)} returned nothing)")
    add("")

    add("by tag:")
    for tag, (count, recall, precision) in report.by_tag().items():
        add(f"  {tag:17} n={count:<3} recall@10={recall:.3f}  precision@5={precision:.3f}")
    add("")

    missed = [score for score in report.questions if score.recall_at_10 < 1.0]
    if missed:
        add(f"questions missing at least one answer ({len(missed)}):")
        for score in missed:
            rank = score.rank_of_first_hit
            where = f"first hit at {rank}" if rank else "no hit in top 10"
            rejected = sorted(
                (score.dropped_scores[chunk_id], chunk_id)
                for chunk_id in score.relevant & set(score.dropped_scores)
            )
            add(f"  {score.question.id}  recall={score.recall_at_10:.2f}  {where}")
            add(f"      {score.question.text}")
            if rejected:
                scores = ", ".join(f"{value:.2f}" for value, _ in rejected)
                add(f"      >> FOUND AND REJECTED by the threshold at [{scores}]")
        add("")

    failed_probes = [score for score in report.probes if not score.passed]
    if failed_probes:
        add(f"probes that returned something they should not have ({len(failed_probes)}):")
        for score in failed_probes:
            add(f"  {score.probe.id}  {score.retrieved_count} chunks — {score.probe.text}")
            if score.probe.note:
                add(f"      {score.probe.note}")

    return "\n".join(lines)
