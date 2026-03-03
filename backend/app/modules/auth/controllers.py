"""Auth orchestration: register, login, me."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.modules.auth.schemas import TokenResponse, UserMeResponse
from app.modules.auth.services import login_user
from app.modules.users.controllers import register_controller
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
    from app.modules.users.repositories import get_user_by_id, has_openai_key
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundError("User not found")
    return UserMeResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        created_at=user.created_at.isoformat(),
        openai_configured=has_openai_key(db, user_id),
        has_avatar=bool(user.avatar_image),
    )


def set_openai_key_controller(db: Session, user_id: str, openai_api_key: str | None) -> None:
    """Store or clear user's OpenAI key (encrypted). Never return the key."""
    from app.modules.users.repositories import set_openai_key
    set_openai_key(db, user_id, openai_api_key)


def update_me_controller_auth(
    db: Session,
    user_id: str,
    *,
    name: str | None = None,
) -> None:
    """Update current user profile (name). Avatar is set via upload endpoint."""
    from app.modules.users.repositories import update_user_profile
    update_user_profile(db, user_id, name=name)


def upload_avatar_controller(
    db: Session,
    user_id: str,
    image_bytes: bytes,
    content_type: str,
) -> None:
    """Store uploaded avatar image. Allowed types: image/jpeg, image/png, image/webp. Max 2MB."""
    allowed = ("image/jpeg", "image/png", "image/webp")
    if content_type not in allowed:
        from app.core.exceptions import AppException
        raise AppException(f"Invalid image type. Use one of: {', '.join(allowed)}", status_code=400)
    if len(image_bytes) > 2 * 1024 * 1024:
        from app.core.exceptions import AppException
        raise AppException("Image too large. Maximum size is 2MB.", status_code=400)
    from app.modules.users.repositories import set_avatar_image
    set_avatar_image(db, user_id, image_bytes, content_type)


def clear_avatar_controller(db: Session, user_id: str) -> None:
    """Remove stored avatar image."""
    from app.modules.users.repositories import clear_avatar_image
    clear_avatar_image(db, user_id)
