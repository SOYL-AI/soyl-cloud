"""Token counting.

Chunk sizes are measured in the unit the model charges in rather than guessed
from characters, because the ratio varies enough between prose and a rate table
that a character budget produces chunks of quite different real sizes.

The encoder is loaded once and cached: constructing it reads a vocabulary file,
and doing that per chunk would dominate ingestion time.
"""

from __future__ import annotations

from functools import lru_cache

import tiktoken

# The encoding used by text-embedding-3-* and the GPT-4 family. Named
# explicitly rather than resolved from a model string, so a model change does
# not silently alter every chunk boundary in the corpus.
ENCODING = "cl100k_base"


@lru_cache(maxsize=1)
def _encoder() -> tiktoken.Encoding:
    return tiktoken.get_encoding(ENCODING)


def count_tokens(text: str) -> int:
    return len(_encoder().encode(text, disallowed_special=()))
