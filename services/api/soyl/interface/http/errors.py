"""Exception handlers producing RFC 9457 problem documents.

One shape for every error the API returns, so the web app has one thing to
parse. Unhandled exceptions never reach the client as a stack trace.
"""

from __future__ import annotations

import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_JSON = "application/problem+json"


def _problem(
    *, status: int, title: str, detail: str, trace_id: str, **extra: object
) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        media_type=PROBLEM_JSON,
        content={"type": "about:blank", "title": title, "status": status, "detail": detail,
                 "trace_id": trace_id, **extra},
    )


def _trace_id(request: Request) -> str:
    """Correlates a client-visible error with a server log line.

    Railway does not inject a request id, so one is minted here when absent.
    """
    return request.headers.get("x-request-id") or str(uuid.uuid4())


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _problem(
            status=422,
            title="Validation failed",
            detail="The request body did not match the expected schema.",
            trace_id=_trace_id(request),
            errors=[
                {"field": ".".join(str(part) for part in error["loc"][1:]), "message": error["msg"]}
                for error in exc.errors()
            ],
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _problem(
            status=exc.status_code,
            title=str(exc.detail),
            detail=str(exc.detail),
            trace_id=_trace_id(request),
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        # Deliberately opaque. The detail is in the logs, keyed by trace_id.
        return _problem(
            status=500,
            title="Internal error",
            detail="The request could not be completed.",
            trace_id=_trace_id(request),
        )
