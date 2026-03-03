"""Notifications API schemas."""
from __future__ import annotations

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    title: str
    body: str | None
    link: str | None
    read_at: str | None
    created_at: str
