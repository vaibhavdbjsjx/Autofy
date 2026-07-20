"""Routers package.

Import the router *submodules* so callers use the `<module>.router` pattern
consistently, e.g. `from routers import auth` then `auth.router`.

(Previously this file did `from routers.auth import router as auth`, which
rebound the names to the APIRouter objects — but main.py calls `auth.router`,
so every include_router() crashed with 'APIRouter has no attribute router'.
Importing the modules here fixes that uniformly, including `email`.)
"""

from routers import (
    auth,
    business,
    team_member,
    knowledge,
    leads,
    conversations,
    whatsapp,
    payments,
    product,
    orders,
    ai_training,
    crm,
    marketing,
    tickets,
    email,
)

__all__ = [
    "auth",
    "business",
    "team_member",
    "knowledge",
    "leads",
    "conversations",
    "whatsapp",
    "payments",
    "product",
    "orders",
    "ai_training",
    "crm",
    "marketing",
    "tickets",
    "email",
]
