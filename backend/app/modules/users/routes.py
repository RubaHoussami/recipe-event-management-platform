"""User routes (user management if needed). Auth uses /auth/me."""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()
# User CRUD could be added here; currently auth handles register/me.
