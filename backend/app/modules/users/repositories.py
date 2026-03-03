"""User DB access helpers."""
from __future__ import annotations

import uuid
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
