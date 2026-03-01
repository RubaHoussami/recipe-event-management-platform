"""Standard API response wrappers if used."""
from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str


class IdResponse(BaseModel):
    """Response with created resource id."""

    id: Any
