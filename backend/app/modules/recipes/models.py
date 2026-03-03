"""Recipe ORM model."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.common.models import Base, TimestampMixin, UUIDMixin


class Recipe(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "recipes"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ingredients: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    steps: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
