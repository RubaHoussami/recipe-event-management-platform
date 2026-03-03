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
    cuisine: str | None = Field(None, max_length=100)
    ingredients: list[str] | None = None
    steps: list[str] | None = None


class RecipeResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    cuisine: str | None
    ingredients: list[str]
    steps: list[str]
    tags: list[str] = Field(default_factory=list, description="Tags (populated in GET single)")
    statuses: list[str] = Field(default_factory=list, description="Statuses: favorite, to_try, made_before (populated in GET single)")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecipeTagAdd(BaseModel):
    tag: str = Field(..., min_length=1, max_length=255)


class RecipeStatusAdd(BaseModel):
    status: str = Field(..., pattern="^(favorite|to_try|made_before)$")
