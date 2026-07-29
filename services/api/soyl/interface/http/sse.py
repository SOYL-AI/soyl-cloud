"""Server-sent events.

Hand-rolled rather than `sse-starlette`, which is three lines of formatting
against a dependency that would also want to own the response class and the
ping loop. The format is a published standard and it is not going to change.

`UPDATE.md` §6.7 is a non-negotiable and it is about the *headers*, not the
body: **`no-store, no-transform` on every streaming response.** A proxy that
buffers destroys the experience — the whole answer arrives at once after ten
seconds of nothing, which is worse than not streaming, because the user has
been watching a spinner that promised otherwise. `no-transform` is the half
people forget: it is what stops a compressing intermediary holding bytes back
waiting for a full window.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi.responses import StreamingResponse

# §6.7, plus the two that stop specific proxies buffering.
STREAM_HEADERS = {
    "Cache-Control": "no-store, no-transform",
    "Connection": "keep-alive",
    # nginx honours this and buffers by default without it. Railway's edge and
    # Vercel's proxy both sit in front of this service.
    "X-Accel-Buffering": "no",
}


def event(name: str, data: Any, *, sequence: int | None = None) -> str:
    """One SSE frame.

    `data` is JSON on a single line: the wire format ends a frame at a blank
    line, so a pretty-printed payload containing one would truncate the event
    silently and the client would see a parse error for a message that was
    never malformed.
    """
    body = json.dumps(data, default=str, separators=(",", ":"))
    lines = []
    if sequence is not None:
        lines.append(f"id: {sequence}")
    lines.append(f"event: {name}")
    lines.append(f"data: {body}")
    return "\n".join(lines) + "\n\n"


def stream(events: AsyncIterator[str]) -> StreamingResponse:
    return StreamingResponse(
        events,
        media_type="text/event-stream",
        headers=STREAM_HEADERS,
    )
