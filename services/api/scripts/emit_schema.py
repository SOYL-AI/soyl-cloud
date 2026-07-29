"""Emit the API's JSON Schema for the contract test to check TypeScript against.

    uv run python scripts/emit_schema.py

The Pydantic models are the source of truth for the rules; `packages/contracts`
holds hand-written TypeScript for the shape. Neither can verify the other by
existing, so this writes the schema and `contracts.test.mts` compares the two.

Hand-written TypeScript rather than generated: generated types are unreadable,
and the envelope is the thing frontend engineers will read most often to
understand what an answer *is*. The cost of writing them by hand is that they
can drift, and that cost is what this file removes.
"""

from __future__ import annotations

import json
from pathlib import Path

from soyl.domain.ai.envelope import DraftAnswer, Envelope

OUT = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "schema"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)

    for name, model in (("envelope", Envelope), ("draft-answer", DraftAnswer)):
        schema = model.model_json_schema()
        path = OUT / f"{name}.schema.json"
        path.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {path.relative_to(OUT.parents[2])}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
