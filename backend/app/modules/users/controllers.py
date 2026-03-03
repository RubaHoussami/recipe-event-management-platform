"""User/Auth orchestration: permission checks, call services, map ORM -> schemas."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.modules.users.models import User
from app.modules.users.schemas import UserMeResponse
from app.modules.users.services import get_user_for_auth, register_user


def register_controller(
    db: Session,
    email: str,
    name: str,
    password: str,
) -> User:
    return register_user(db, email=email, name=name, password=password)


def me_controller(db: Session, user_id: str) -> UserMeResponse:
    user = get_user_for_auth(db, user_id)
    if not user:
        raise ValueError("User not found")
    return UserMeResponse.model_validate(user)
