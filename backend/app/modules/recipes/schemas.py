"""Recipe Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class RecipeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    ingredients: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)


class RecipeUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    ingredients: list[str] | None = None
    steps: list[str] | None = None


class RecipeResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    ingredients: list[str]
    steps: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
