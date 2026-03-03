"""Auth domain logic: login verification, token creation."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError
from app.core.security import create_access_token, verify_password
from app.modules.users.repositories import get_user_by_email


def login_user(db: Session, email: str, password: str) -> tuple[str, str]:
    """Verify credentials and return (access_token, user_id). Raises ForbiddenError if invalid."""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise ForbiddenError("Invalid email or password")
    token = create_access_token(subject=str(user.id))
    return token, str(user.id)
