"""Transactional email, behind one function.

The Python counterpart of `src/lib/email.ts`, deliberately the same shape: one
POST to Resend's REST API, no SDK, everything provider-specific in this file.
Swapping to Postmark or SES stays one file on each side.

Two senders exist because two runtimes send: the web app sends the contact-form
notification, the API sends verification and reset. They should hold *separate*
API keys so revoking one does not take out the other.
"""

from __future__ import annotations

import httpx

RESEND_ENDPOINT = "https://api.resend.com/emails"
SEND_TIMEOUT_SECONDS = 8.0


class EmailNotConfigured(Exception):
    """No API key. In local development this is normal, not a failure."""


class EmailSendFailed(Exception):
    def __init__(self, message: str, status: int | None = None) -> None:
        self.status = status
        super().__init__(message)


class EmailSender:
    """Sends, or deliberately does not.

    When unconfigured it raises `EmailNotConfigured` rather than silently
    succeeding — the caller decides whether that is fatal. For signup it is
    not: an account is still created and the verification link can be resent.
    """

    def __init__(self, *, api_key: str | None, from_address: str | None) -> None:
        self._api_key = api_key
        self._from = from_address

    @property
    def configured(self) -> bool:
        return bool(self._api_key and self._from)

    async def send(self, *, to: str, subject: str, text: str) -> str:
        if not self.configured:
            raise EmailNotConfigured

        try:
            async with httpx.AsyncClient(timeout=SEND_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    RESEND_ENDPOINT,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json={"from": self._from, "to": [to], "subject": subject, "text": text},
                )
        except (TimeoutError, httpx.HTTPError) as exc:
            raise EmailSendFailed(f"Email provider unreachable: {type(exc).__name__}") from exc

        if response.status_code >= 400:
            # Provider diagnostics only. The body of the message is never
            # logged and never included here.
            raise EmailSendFailed(
                f"Email provider returned {response.status_code}: {response.text[:500]}",
                response.status_code,
            )

        body: dict[str, str] = response.json()
        return body.get("id", "")


def verification_email(*, display_name: str | None, link: str) -> tuple[str, str]:
    greeting = f"Hi {display_name}," if display_name else "Hi,"
    return (
        "Confirm your email address",
        f"""{greeting}

Confirm your email address to finish setting up your SOYL account:

{link}

This link works once and expires in 24 hours. If you did not create an
account, you can ignore this email — nothing will happen.

— SOYL
""",
    )


def password_reset_email(*, display_name: str | None, link: str) -> tuple[str, str]:
    greeting = f"Hi {display_name}," if display_name else "Hi,"
    return (
        "Reset your password",
        f"""{greeting}

Someone asked to reset the password for this SOYL account. If it was you:

{link}

This link works once and expires in one hour. Using it will sign you out
everywhere else.

If it was not you, you can ignore this email. Your password has not changed
and nobody has been told whether this address has an account.

— SOYL
""",
    )
