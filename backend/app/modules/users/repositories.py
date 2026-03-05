"""User DB access helpers."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.crypto import decrypt_openai_key, encrypt_openai_key
from app.modules.users.models import User

if TYPE_CHECKING:
    pass


def get_user_by_id(db: Session, user_id: str | uuid.UUID) -> User | None:
    uid = user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(user_id)
    return db.execute(select(User).where(User.id == uid)).scalar_one_or_none()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def create_user(
    db: Session,
    email: str,
    name: str,
    hashed_password: str,
    role: str = "user",
) -> User:
    user = User(
        email=email,
        name=name,
        hashed_password=hashed_password,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_openai_key_plain(db: Session, user_id: str | uuid.UUID) -> str | None:
    """Return decrypted OpenAI key for backend use only. Never expose to client."""
    user = get_user_by_id(db, user_id)
    if not user or not user.encrypted_openai_api_key:
        return None
    plain = decrypt_openai_key(user.encrypted_openai_api_key)
    return plain if plain else None


def set_openai_key(db: Session, user_id: str | uuid.UUID, plain_key: str | None) -> None:
    """Store encrypted key or clear if plain_key is None. Never store or return plain key."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    if plain_key is None or not plain_key.strip():
        user.encrypted_openai_api_key = None
    else:
        user.encrypted_openai_api_key = encrypt_openai_key(plain_key.strip())
    db.commit()


def has_openai_key(db: Session, user_id: str | uuid.UUID) -> bool:
    """Whether user has a stored OpenAI key (for openai_configured in /me)."""
    user = get_user_by_id(db, user_id)
    return bool(user and user.encrypted_openai_api_key)


def set_ai_preference(db: Session, user_id: str | uuid.UUID, preference: str) -> None:
    """Set user AI preference: off, my_key, or hosted."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    if preference not in ("off", "my_key", "hosted"):
        return
    user.ai_preference = preference
    db.commit()


def update_user_profile(
    db: Session,
    user_id: str | uuid.UUID,
    *,
    name: str | None = None,
    avatar_url: str | None = None,
) -> None:
    """Update user profile fields. None means leave unchanged."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    if name is not None:
        user.name = name
    if avatar_url is not None:
        user.avatar_url = avatar_url if avatar_url else None
    db.commit()


def set_avatar_image(
    db: Session,
    user_id: str | uuid.UUID,
    image_bytes: bytes,
    content_type: str,
) -> None:
    """Store uploaded avatar image and content type. Clears avatar_url when setting image."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    user.avatar_image = image_bytes
    user.avatar_content_type = content_type
    user.avatar_url = None  # prefer stored image over URL
    db.commit()


def clear_avatar_image(db: Session, user_id: str | uuid.UUID) -> None:
    """Remove stored avatar image."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    user.avatar_image = None
    user.avatar_content_type = None
    db.commit()


def set_email_otp(
    db: Session,
    user_id: str | uuid.UUID,
    code: str,
    expires_at: datetime,
) -> None:
    """Store OTP code and expiry for email verification."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    user.email_otp_code = code
    user.email_otp_expires_at = expires_at
    user.email_otp_sent_at = datetime.now(timezone.utc)
    db.commit()


def clear_email_otp(db: Session, user_id: str | uuid.UUID) -> None:
    """Clear OTP after successful verification."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    user.email_otp_code = None
    user.email_otp_expires_at = None
    db.commit()


def mark_email_verified(db: Session, user_id: str | uuid.UUID) -> None:
    """Set email_verified_at and clear OTP."""
    user = get_user_by_id(db, user_id)
    if not user:
        return
    user.email_verified_at = datetime.now(timezone.utc)
    user.email_otp_code = None
    user.email_otp_expires_at = None
    db.commit()
