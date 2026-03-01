"""Shared Pydantic schemas: pagination, error format."""
from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query params for list endpoints."""

    limit: int = Field(default=20, ge=1, le=100, description="Page size")
    offset: int = Field(default=0, ge=0, description="Offset for pagination")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""

    items: list[T]
    total: int
    limit: int
    offset: int
