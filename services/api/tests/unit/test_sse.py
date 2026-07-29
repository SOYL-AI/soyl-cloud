"""The SSE frame format.

Small, and worth having because the two ways this goes wrong are both silent.
A frame with an embedded blank line truncates at the wrong place and the client
reports a parse error for a message that was never malformed. A missing
`no-transform` lets a compressing proxy hold bytes back, and the stream arrives
all at once after ten seconds — which looks like a slow server rather than a
buffering intermediary, and is the harder thing to diagnose because the server
is doing everything right.
"""

from __future__ import annotations

import json

from soyl.interface.http.sse import STREAM_HEADERS, event


def test_a_frame_has_a_name_and_a_json_body() -> None:
    frame = event("block.complete", {"id": "b1"})

    assert "event: block.complete" in frame
    assert '"id":"b1"' in frame
    assert frame.endswith("\n\n")


def test_multiline_content_does_not_break_the_frame() -> None:
    """The wire format ends a frame at a blank line.

    A block's markdown contains paragraph breaks, so a pretty-printed body
    would truncate the event exactly where the answer got interesting.
    """
    frame = event("block.complete", {"markdown": "First para.\n\nSecond para."})

    body = frame.split("data: ", 1)[1].rstrip("\n")
    assert "\n" not in body
    assert json.loads(body)["markdown"] == "First para.\n\nSecond para."


def test_a_sequence_id_is_emitted_when_given() -> None:
    # Lets a client reconnect with Last-Event-ID rather than replaying a turn.
    assert event("layout", {}, sequence=3).startswith("id: 3\n")


def test_uuids_and_datetimes_survive_serialisation() -> None:
    import uuid

    frame = event("envelope.complete", {"turn_id": uuid.uuid4()})

    assert json.loads(frame.split("data: ", 1)[1].rstrip("\n"))["turn_id"]


def test_the_headers_carry_both_halves_of_the_non_negotiable() -> None:
    """UPDATE.md 6.7: `no-store, no-transform` on every streaming response.

    `no-transform` is the half that gets dropped, and it is the one that stops
    a compressing intermediary buffering the stream into a single delivery.
    """
    cache = STREAM_HEADERS["Cache-Control"]

    assert "no-store" in cache
    assert "no-transform" in cache
    assert STREAM_HEADERS["X-Accel-Buffering"] == "no"
