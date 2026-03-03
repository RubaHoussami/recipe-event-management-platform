"""Event invite Pydantic schemas."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class InviteCreate(BaseModel):
    invited_email: EmailStr


class InviteResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    invited_email: str
    invited_user_id: uuid.UUID | None
    status: str
    token: str
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteRespondRequest(BaseModel):
    status: str = Field(..., pattern="^(accepted|declined|maybe)$")


class AttendeeItem(BaseModel):
    email: str
    name: str | None
    user_id: uuid.UUID | None
    status: str  # owner | accepted | declined | maybe | pending


class AttendeesResponse(BaseModel):
    owner: AttendeeItem
    invitees: list[AttendeeItem]
