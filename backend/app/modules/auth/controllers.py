"""Auth orchestration: register, login, me."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.modules.auth.schemas import TokenResponse, UserMeResponse
from app.modules.auth.services import login_user
from app.modules.users.controllers import me_controller, register_controller
from app.modules.users.schemas import UserResponse


def register_controller_auth(
    db: Session,
    email: str,
    name: str,
    password: str,
) -> UserResponse:
    user = register_controller(db, email=email, name=name, password=password)
    return UserResponse.model_validate(user)


def login_controller_auth(db: Session, email: str, password: str) -> TokenResponse:
    token, _ = login_user(db, email=email, password=password)
    return TokenResponse(access_token=token, token_type="bearer")


def me_controller_auth(db: Session, user_id: str) -> UserMeResponse:
    from app.modules.users.repositories import has_openai_key
    me = me_controller(db, user_id)
    return UserMeResponse(
        id=str(me.id),
        email=me.email,
        name=me.name,
        role=me.role,
        created_at=me.created_at.isoformat(),
        openai_configured=has_openai_key(db, user_id),
    )


def set_openai_key_controller(db: Session, user_id: str, openai_api_key: str | None) -> None:
    """Store or clear user's OpenAI key (encrypted). Never return the key."""
    from app.modules.users.repositories import set_openai_key
    set_openai_key(db, user_id, openai_api_key)
