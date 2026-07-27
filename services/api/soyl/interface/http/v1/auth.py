"""Authentication routes.

Thin by design: every rule that matters lives in `AuthService`, so the
uniform-response and audit guarantees hold no matter which route is added next.

All of these are unauthenticated and reachable from the open internet, and none
of them leaks whether an address has an account.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from soyl.application.auth.service import AuthError, AuthService, RequestContext
from soyl.infrastructure.db.session import untenanted_session
from soyl.infrastructure.email import EmailSender
from soyl.interface.http.deps import get_email_sender, get_session_factory, get_settings_dep
from soyl.settings import Settings

router = APIRouter(prefix="/v1/auth", tags=["auth"])

# no-store on every auth response. UPDATE.md §6.7 requires it for streaming; it
# matters at least as much here, where a cached response could hand a session
# token to the next person through a shared proxy.
NO_STORE = "no-store, no-transform"


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=1024)
    display_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=1024)


class LoginResponse(BaseModel):
    session_token: str
    user_id: UUID
    email: str
    display_name: str | None
    active_tenant_id: UUID | None
    email_verified: bool
    expires_at: datetime


class TokenRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=1, max_length=512)


class EmailRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr


class ResetConfirmRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=1, max_length=512)
    password: str = Field(min_length=1, max_length=1024)


def _context(request: Request) -> RequestContext:
    forwarded = request.headers.get("x-forwarded-for", "")
    # First entry is the client; the rest are proxies that appended themselves.
    ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else None)
    return RequestContext(
        ip=ip or None,
        user_agent=request.headers.get("user-agent"),
        trace_id=request.headers.get("x-request-id"),
    )


def _service(session: AsyncSession, sender: EmailSender, settings: Settings) -> AuthService:
    return AuthService(session, sender=sender, web_base_url=str(settings.web_base_url))


def _bearer(authorization: str | None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:]
    return ""


@router.post("/signup", status_code=status.HTTP_202_ACCEPTED)
async def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    sender: Annotated[EmailSender, Depends(get_email_sender)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> dict[str, str]:
    """202 whether or not the address was already registered.

    The difference is carried by the email, not by the response.
    """
    response.headers["Cache-Control"] = NO_STORE

    async with untenanted_session(factory) as session:
        try:
            await _service(session, sender, settings).signup(
                email=str(payload.email),
                password=payload.password,
                display_name=payload.display_name,
                context=_context(request),
            )
        except AuthError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {"status": "check_your_email"}


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    sender: Annotated[EmailSender, Depends(get_email_sender)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> LoginResponse:
    response.headers["Cache-Control"] = NO_STORE

    async with untenanted_session(factory) as session:
        try:
            result = await _service(session, sender, settings).login(
                email=str(payload.email),
                password=payload.password,
                context=_context(request),
            )
        except AuthError as exc:
            # 401 with one message for every cause. Which of "no such user",
            # "wrong password" and "suspended" it was stays in the audit log.
            raise HTTPException(status_code=401, detail=str(exc)) from exc

    return LoginResponse(
        session_token=result.session_token,
        user_id=result.user_id,
        email=result.email,
        display_name=result.display_name,
        active_tenant_id=result.active_tenant_id,
        email_verified=result.email_verified,
        expires_at=result.expires_at,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    sender: Annotated[EmailSender, Depends(get_email_sender)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
    authorization: Annotated[str | None, Header()] = None,
) -> Response:
    """Always 204, including for an unknown or already-revoked token."""
    token = _bearer(authorization)

    if token:
        async with untenanted_session(factory) as session:
            await _service(session, sender, settings).logout(
                token=token, context=_context(request)
            )

    return Response(status_code=status.HTTP_204_NO_CONTENT, headers={"Cache-Control": NO_STORE})


@router.post("/verify-email", status_code=status.HTTP_204_NO_CONTENT)
async def verify_email(
    payload: TokenRequest,
    request: Request,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    sender: Annotated[EmailSender, Depends(get_email_sender)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> Response:
    async with untenanted_session(factory) as session:
        try:
            await _service(session, sender, settings).verify_email(
                token=payload.token, context=_context(request)
            )
        except AuthError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT, headers={"Cache-Control": NO_STORE})


@router.post("/password-reset", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    payload: EmailRequest,
    request: Request,
    response: Response,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    sender: Annotated[EmailSender, Depends(get_email_sender)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> dict[str, str]:
    """202 for every address, registered or not."""
    response.headers["Cache-Control"] = NO_STORE

    async with untenanted_session(factory) as session:
        await _service(session, sender, settings).request_password_reset(
            email=str(payload.email), context=_context(request)
        )

    return {"status": "check_your_email"}


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_password_reset(
    payload: ResetConfirmRequest,
    request: Request,
    factory: Annotated[async_sessionmaker[AsyncSession], Depends(get_session_factory)],
    sender: Annotated[EmailSender, Depends(get_email_sender)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> Response:
    async with untenanted_session(factory) as session:
        try:
            await _service(session, sender, settings).confirm_password_reset(
                token=payload.token,
                new_password=payload.password,
                context=_context(request),
            )
        except AuthError as exc:
            code = 422 if exc.code == "weak_password" else 400
            raise HTTPException(status_code=code, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT, headers={"Cache-Control": NO_STORE})
