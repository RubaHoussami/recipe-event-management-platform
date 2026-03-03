"""User ORM model."""
from __future__ import annotations

from sqlalchemy import LargeBinary, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.common.models import Base, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="user")
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    avatar_image: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    avatar_content_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Encrypted at rest; never exposed in API responses
    encrypted_openai_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
