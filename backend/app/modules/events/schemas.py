"""Event Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    location: str | None = Field(None, max_length=500)
    start_time: datetime = Field(..., description="ISO datetime with timezone")
    end_time: datetime | None = Field(None, description="ISO datetime with timezone")


class EventUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    location: str | None = Field(None, max_length=500)
    start_time: datetime | None = None
    end_time: datetime | None = None


class EventResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    location: str | None
    start_time: datetime
    end_time: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
