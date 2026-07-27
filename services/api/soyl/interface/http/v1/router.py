"""v1 router assembly."""

from fastapi import APIRouter

from soyl.interface.http.v1 import health, leads

router = APIRouter()
router.include_router(health.router)
router.include_router(leads.router)
