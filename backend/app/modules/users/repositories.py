"""User DB access helpers."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.orm import Session

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
