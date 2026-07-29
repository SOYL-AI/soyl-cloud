# The retrieval eval

`UPDATE.md` §M4 accepts retrieval when, on a hand-labelled set of 40
question/chunk pairs, **recall@10 ≥ 0.85 and precision@5 ≥ 0.70**, and asking
something the corpus does not cover produces an honest "I don't have that".

This directory is that set, the corpus it is labelled against, and the harness
that measures it.

```
uv run python -m evals.run                     # fake providers, free, plumbing only
uv run python -m evals.run --azure             # retrieval quality (~8 min, ~₹25)
uv run python -m evals.run --azure --answers   # retrieval AND answers (~25 min, ~₹60)
```

`--answers` runs the full pipeline for every question and probe and reports
three numbers that retrieval alone cannot produce:

| | |
|---|---|
| **answer rate** | of questions the corpus covers, how many produced an answer |
| **refusal rate** | of probes it does not cover, how many were refused |
| **citation integrity** | answers whose every citation was in `ai.retrieval_log` |

The first two are in tension by design, which is why both are reported. A
pipeline that refuses everything scores perfectly on honesty and is worthless;
one that answers everything is the product we are trying not to build. Moving
one without the other is not an improvement.

Citation integrity is checked against the retrieval log rather than the
envelope, because the envelope is the thing under test — asking it to confirm
its own citations proves only that it is internally consistent. It should
always be 1.000, since the validator runs before persistence, so anything less
means the validator has a hole rather than the model has a quirk.

## Read this before quoting a number from it

Two things are wrong with this set, and both are structural rather than
fixable by trying harder.

**1. There are no pilot documents.** §M4 says the set is "built from real pilot
documents". There are none: per the M3 boundary in `DECISION-LOG.md`, no hotel
uploads anything real until the DPA is signed. So the corpus in `corpus/` is
seven synthetic hotel documents — realistic in structure, vocabulary and the
kind of ambiguity real SOPs contain, but written for this purpose.

**2. The corpus, the questions and the labels have one author.** That is
circularity, and it inflates a score unless it is actively worked against. The
specific failure is writing questions *from* the chunks, which copies the
document's vocabulary into the query and hands lexical search the easiest
possible job.

The method used against it:

- The corpus was written first, in document voice — formal policy prose.
- Questions were then written in **operator voice** from a topic list, in the
  words a duty manager would actually type, never reusing a distinctive phrase
  from the document. "how late can a guest stay in the room before we start
  charging them for another night" against a section that says "extended
  occupancy" and "room-only rate".
- Near-miss traps were built in deliberately: three separate cancellation
  scales, four sections about water, three about fire, two about notice periods.
- Twelve probes ask things the corpus genuinely does not answer, half of them
  near-misses where a strongly related section exists.

It is a **development set** — good for catching regressions, good for tuning
against, and it found three real bugs. It is not independent evidence for an
acceptance gate. Replace or extend it with real documents when the DPA lands.

## Why the headline numbers are 1.000, and why that is not good news

The last run scored recall@10 and precision@5 at 1.000 on every tag. A perfect
score is evidence the set is too easy, not evidence retrieval is finished:

- The corpus is **50 chunks**. Top-10 is a fifth of everything, so a retriever
  has to be actively wrong to miss. A real hotel group's corpus is hundreds of
  documents, where the same question has twenty plausible neighbours.
- The traps were designed by someone who knew they were traps.

The number to watch instead is **context purity: 0.750** — of the chunks
actually handed to the model, three quarters earn their place. That one is not
saturated, it measures the dilution §45.3 argues from, and it can be bad while
recall is perfect.

`precision@5` here divides by the number of relevant chunks, not by 5. Against
a single-answer question, standard precision@5 caps at 0.2 and §M4's 0.70 target
would be unreachable. The consequence is that it reduces to "was the answer in
the top 5" — recall by another name, which is why the two move together. That
is a flaw in the metric as specified, not in the pipeline, and `context purity`
exists because of it.

## What the run does prove

- The pipeline runs end to end on real embeddings against real Postgres.
- **The vocabulary gap is genuinely bridged.** All 18 `vocabulary-gap`
  questions hit, and those share almost no words with their answers. That is
  the hypothetical-question index (§43.2) doing the job it was built for.
- **Exact identifiers work.** "what is the reference number on the Sparkle
  Linens agreement" retrieves `SL-2026-114`. Vector search cannot do this; the
  lexical retriever can, which is §45.1's argument for fusing them.
- The threshold is not costing recall: pre-threshold and post-threshold recall
  are both 1.000, so §45.3's 0.25 is not currently rejecting correct answers.

## The honest weak spot: the probes

**7 of 12** probes correctly returned nothing on the last run — and 9 of 12 on
the run before, with nothing changed between them. The LLM reranker is not
deterministic, so this rate is noisy in a way the retrieval metrics are not.

Every failure is a near-miss: "what time does the spa open" returns outlet
hours for other outlets; "what commission does booking.com charge us" returns
the travel agent commission section, which would support a confident and wrong
ten per cent.

This is the acceptance criterion `UPDATE.md` tells us to **test deliberately and
often**, and it is the one that is not met. It is also a design input for the
answer pipeline rather than only a retrieval problem: retrieval will hand the
model one or two weak chunks for an uncovered question, so the pipeline above it
has to be built to say "I don't have that" **even when retrieval returned
something**. It cannot treat a non-empty result as permission to answer.

## Three bugs this set found before it produced a number

1. **A cross-reference became a heading.** Hard-wrapped prose ending "…in
   section\n7. The pool deck serves…" matched the numbered-clause pattern.
   Because it parsed as depth 1, it replaced the document title at the root of
   the heading path for *every subsequent chunk* — poisoning the context header
   §43.2 calls the highest-impact retrieval improvement. Cross-references and
   hard wrapping are ordinary in real SOPs.

2. **Merged sections lost their heading.** The chunker merges a small section
   into a sibling to hit the size target, and the absorbed heading vanished —
   so a chunk headed "Arrival timings" ran straight into the departure policy
   with no marker. It now re-emits the heading into the body.

3. **The reranker was reading a third of each chunk.** `CANDIDATE_CHARS` was
   1200 against a chunk cap of 900 tokens (~3600 characters). "Sparkle Linens"
   scored its own answer **0.00**, correctly — the contract number sits past
   the cut, and the fragment it could see really is irrelevant. Fixing it moved
   `exact-identifier` and `multi-chunk` from 0.500 to 1.000.

The general form of the third is the dangerous one: truncation made the
reranker judge something *different from what the retriever hands the model*,
so the disagreement was invisible from either end.

## How it is put together

`questions.toml` holds 40 labelled questions and 12 probes. A label names a
**section of a document**, never a chunk id — ids are regenerated on every
ingest and boundaries move whenever chunking is tuned, so an id-labelled set
would rot on the first change to §43.1. The harness resolves a section to
whichever chunk carries it, including one it was merged into, and **raises if
it cannot**. An unresolvable label must never be allowed to score zero: that
looks like a retrieval regression and sends someone to debug the retriever.

`--azure` paces itself between questions. The deployment's tokens-per-minute
quota is the binding constraint, and without pacing reranking is rate limited
into a fusion-order fallback — which silently measures a different pipeline and
reports it as a result. An earlier run reranked only 25 of 40 questions this
way and looked like a finished measurement.

Cost is roughly ₹25 a run: ingestion with hypothetical question generation,
plus 52 rerank calls at ~30 candidates each. That per-query rerank cost is
material at scale and is an argument for the cross-encoder §45.3 actually wants.
