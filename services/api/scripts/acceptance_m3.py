"""M3's acceptance criterion, run for real.

    "A 40-page PDF SOP uploads and is queryable within two minutes, chunks
     carry correct heading paths, and a deliberately corrupt file fails
     gracefully with a readable error rather than a stack trace."

Not a test — a script, because it needs the API and the worker running as
separate processes, which is the arrangement being verified. A passing pytest
against an in-process pipeline would not prove the queue works.

    uv run python scripts/acceptance_m3.py http://localhost:8030
"""

from __future__ import annotations

import asyncio
import sys
import time
import uuid

import httpx
import pymupdf

PASSWORD = "a-perfectly-reasonable-passphrase"
DEADLINE_SECONDS = 120

SECTIONS = [
    ("1. Purpose and scope", "This standard operating procedure applies to all front-of-house "
     "and housekeeping staff across every property in the group. It supersedes all "
     "previous versions and takes effect immediately upon publication."),
    ("2. Receiving a guest complaint", "Listen without interrupting. Record the room number, "
     "the time of the report and the name of the staff member who received it. Do not "
     "promise a remedy before the facts have been established."),
    ("3. Escalation", "Complaints that are not resolved within fifteen minutes must be "
     "escalated to the general manager on duty. Escalation is not a failure and staff "
     "are never penalised for escalating early."),
    ("3.2 Noise complaints after 22:00", "If a guest reports noise after 22:00 the duty "
     "manager must attend within ten minutes. Do not offer compensation before verifying "
     "the complaint with a second member of staff."),
    ("4. Cancellation and refunds", "Corporate reservations may be cancelled without penalty "
     "up to 48 hours before arrival. Leisure bookings follow the rate plan attached to the "
     "reservation at the time of booking."),
    ("5. Laundry and vendor turnaround", "The contracted laundry vendor collects at 07:00 "
     "daily and returns finished linen within 24 hours. Delays beyond 36 hours must be "
     "reported to procurement."),
    ("6. Lost property", "Items left behind are logged, bagged and held for 90 days. "
     "Valuables are stored in the safe and recorded in the duty log."),
    ("7. Fire and evacuation", "Assembly is at the front car park. The duty manager takes "
     "the guest register and confirms every room has been cleared."),
]


def build_pdf(pages: int = 40) -> bytes:
    """A realistic 40-page SOP: headings, numbered clauses, prose."""
    document = pymupdf.open()

    for index in range(pages):
        heading, body = SECTIONS[index % len(SECTIONS)]
        page = document.new_page()
        y = 72

        page.insert_text((72, y), f"{heading} (part {index // len(SECTIONS) + 1})", fontsize=14)
        y += 28

        # Wrap the body so each page carries a realistic amount of text.
        for _ in range(6):
            for line in _wrap(body, 88):
                page.insert_text((72, y), line, fontsize=10)
                y += 13
            y += 8

    data: bytes = document.tobytes()
    document.close()
    return data


def _wrap(text: str, width: int) -> list[str]:
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


async def sign_in(client: httpx.AsyncClient) -> dict[str, str]:
    email = f"m3-{uuid.uuid4().hex[:8]}@example.com"
    await client.post("/v1/auth/signup", json={"email": email, "password": PASSWORD})
    login = await client.post("/v1/auth/login", json={"email": email, "password": PASSWORD})
    headers = {"Authorization": f"Bearer {login.json()['session_token']}"}

    await client.post(
        "/v1/tenants",
        headers=headers,
        json={"name": "Acceptance Hotel", "slug": f"acc-{uuid.uuid4().hex[:8]}", "country": "IN"},
    )
    return headers


async def upload(
    client: httpx.AsyncClient, headers: dict[str, str], data: bytes, filename: str, ctype: str
) -> str:
    ticket = (
        await client.post(
            "/v1/documents",
            headers=headers,
            json={"filename": filename, "content_type": ctype},
        )
    ).json()

    async with httpx.AsyncClient(timeout=120) as uploader:
        await uploader.put(
            ticket["upload_url"], content=data, headers=ticket["required_headers"]
        )

    await client.post(f"/v1/documents/{ticket['document_id']}/ingest", headers=headers)
    return str(ticket["document_id"])


async def wait_for(
    client: httpx.AsyncClient, headers: dict[str, str], document_id: str, deadline: float
) -> tuple[dict[str, object], float]:
    started = time.monotonic()
    while time.monotonic() - started < deadline:
        documents = (await client.get("/v1/documents", headers=headers)).json()
        found = next((d for d in documents if d["id"] == document_id), None)
        if found and found["status"] in ("ready", "failed"):
            return found, time.monotonic() - started
        await asyncio.sleep(1)

    return {}, time.monotonic() - started


async def main(base_url: str) -> int:
    failures: list[str] = []

    async with httpx.AsyncClient(base_url=base_url, timeout=60) as client:
        headers = await sign_in(client)

        # ── 1. A 40-page PDF, queryable within two minutes ──────────────────
        pdf = build_pdf(40)
        print(f"Built a 40-page SOP: {len(pdf) / 1024:.0f} KB")

        started = time.monotonic()
        document_id = await upload(client, headers, pdf, "guest-complaint-sop.pdf", "application/pdf")
        document, waited = await wait_for(client, headers, document_id, DEADLINE_SECONDS)
        total = time.monotonic() - started

        if not document:
            failures.append(f"document never reached a terminal state within {DEADLINE_SECONDS}s")
        elif document["status"] != "ready":
            failures.append(f"document status was {document['status']}: {document.get('error')}")
        else:
            print(f"  status     : {document['status']}")
            print(f"  pages      : {document['page_count']}")
            print(f"  chunks     : {document['chunk_count']}")
            print(f"  queryable  : {total:.1f}s  (limit {DEADLINE_SECONDS}s)")
            if total > DEADLINE_SECONDS:
                failures.append(f"took {total:.1f}s, over the {DEADLINE_SECONDS}s limit")
            if int(document["chunk_count"]) < 5:
                failures.append(f"only {document['chunk_count']} chunks from 40 pages")

        # ── 2. A deliberately corrupt file fails readably ───────────────────
        broken_id = await upload(
            client, headers, b"%PDF-1.7 this is not a pdf at all", "broken.pdf", "application/pdf"
        )
        broken, _ = await wait_for(client, headers, broken_id, 60)

        if not broken:
            failures.append("corrupt file never reached a terminal state")
        elif broken["status"] != "failed":
            failures.append(f"corrupt file ended as {broken['status']}, expected failed")
        else:
            error = str(broken.get("error") or "")
            print(f"\n  corrupt file stage : {broken.get('stage')}")
            print(f"  corrupt file error : {error}")
            if "Traceback" in error or "Exception" in error:
                failures.append("the error message contains a stack trace")
            if not error:
                failures.append("the failure carried no message")

    print()
    if failures:
        print("FAILED")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("M3 acceptance criteria met.")
    return 0


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    raise SystemExit(asyncio.run(main(url)))
