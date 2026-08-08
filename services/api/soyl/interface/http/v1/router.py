"""v1 router assembly."""

from fastapi import APIRouter

from soyl.interface.http.v1 import (
    admin,
    advisor,
    advisor_chat,
    answers,
    auth,
    conversations,
    documents,
    health,
    leads,
    tenants,
)

router = APIRouter()
router.include_router(health.router)
router.include_router(auth.router)
router.include_router(leads.router)
router.include_router(tenants.router)
router.include_router(documents.router)
router.include_router(answers.router)
router.include_router(advisor.router)
router.include_router(advisor_chat.router)
router.include_router(conversations.router)
router.include_router(admin.router)
