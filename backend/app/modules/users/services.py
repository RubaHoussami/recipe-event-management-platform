"""User domain logic (registration, lookup for auth)."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.core.security import hash_password
from app.modules.users.models import User
from app.modules.users.repositories import create_user, get_user_by_email, get_user_by_id


def register_user(
    db: Session,
    email: str,
    name: str,
    password: str,
    role: str = "user",
) -> User:
    if get_user_by_email(db, email):
        raise ConflictError("Email already registered")
    hashed = hash_password(password)
    return create_user(db, email=email, name=name, hashed_password=hashed, role=role)


def get_user_for_auth(db: Session, user_id: str) -> User | None:
    return get_user_by_id(db, user_id)
