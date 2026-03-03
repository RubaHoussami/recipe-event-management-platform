"""Recipe, RecipeTag, RecipeStatus ORM models."""
from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

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


class RecipeTag(Base, UUIDMixin):
    __tablename__ = "recipe_tags"
    __table_args__ = (UniqueConstraint("recipe_id", "tag", name="uq_recipe_tags_recipe_id_tag"),)

    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag: Mapped[str] = mapped_column(String(255), nullable=False, index=True)


class RecipeStatus(Base, UUIDMixin):
    __tablename__ = "recipe_statuses"
    __table_args__ = (UniqueConstraint("recipe_id", "status", name="uq_recipe_statuses_recipe_id_status"),)

    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # favorite | to_try | made_before
