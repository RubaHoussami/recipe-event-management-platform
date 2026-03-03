"""Friends API schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class AddFriendRequest(BaseModel):
    email: EmailStr


class FriendResponse(BaseModel):
    friend_id: str
    friend_email: str
    friend_name: str
    friend_avatar_url: str | None
    created_at: str


class PersonResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: str | None
