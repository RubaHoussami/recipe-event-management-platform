"""Auth orchestration: register, login, me, verify email, resend OTP."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException, ForbiddenError, NotFoundError
from app.modules.auth.schemas import TokenResponse, UserMeResponse
from app.modules.auth.services import generate_and_send_otp, login_user
from app.modules.users.controllers import register_controller
from app.modules.users.repositories import get_user_by_email, mark_email_verified
from app.modules.users.schemas import UserResponse


def register_controller_auth(
    db: Session,
    email: str,
    name: str,
    password: str,
) -> UserResponse:
    user = register_controller(db, email=email, name=name, password=password)
    generate_and_send_otp(db, str(user.id), user.email)
    return UserResponse.model_validate(user)


def login_controller_auth(db: Session, email: str, password: str) -> TokenResponse:
    token, _ = login_user(db, email=email, password=password)
    return TokenResponse(access_token=token, token_type="bearer")


def verify_email_controller(db: Session, email: str, code: str) -> TokenResponse:
    """Verify OTP and mark email verified; return token so user is logged in."""
    user = get_user_by_email(db, email)
    if not user:
        raise NotFoundError("User not found")
    if user.email_verified_at:
        raise AppException("Email is already verified. You can sign in.", status_code=400)
    if not user.email_otp_code or not user.email_otp_expires_at:
        raise ForbiddenError("No verification code sent. Request a new code.")
    if datetime.now(timezone.utc) > user.email_otp_expires_at:
        raise ForbiddenError("Verification code has expired. Request a new code.")
    if user.email_otp_code.strip() != code.strip():
        raise ForbiddenError("Invalid verification code.")
    mark_email_verified(db, user.id)
    from app.core.security import create_access_token
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, token_type="bearer")


def resend_otp_controller(db: Session, email: str) -> None:
    """Send a new OTP; rate-limited by cooldown."""
    user = get_user_by_email(db, email)
    if not user:
        raise NotFoundError("User not found")
    if user.email_verified_at:
        raise AppException("Email is already verified.", status_code=400)
    settings = get_settings()
    if user.email_otp_sent_at:
        from datetime import timedelta
        if datetime.now(timezone.utc) < user.email_otp_sent_at + timedelta(seconds=settings.otp_resend_cooldown_seconds):
            raise AppException(
                f"Please wait {settings.otp_resend_cooldown_seconds} seconds before requesting another code.",
                status_code=429,
            )
    generate_and_send_otp(db, str(user.id), user.email)


def me_controller_auth(db: Session, user_id: str) -> UserMeResponse:
    from app.core.config import get_settings
    from app.modules.users.repositories import get_user_by_id, has_openai_key
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundError("User not found")
    s = get_settings()
    azure_available = bool(s.hf_api_key and s.hf_model)
    return UserMeResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        created_at=user.created_at.isoformat(),
        openai_configured=has_openai_key(db, user_id),
        has_avatar=bool(user.avatar_image),
        email_verified=user.email_verified_at is not None,
        ai_preference=getattr(user, "ai_preference", None) or "my_key",
        azure_ai_available=azure_available,
    )


def set_openai_key_controller(db: Session, user_id: str, openai_api_key: str | None) -> None:
    """Store or clear user's OpenAI key (encrypted). Never return the key."""
    from app.modules.users.repositories import set_openai_key
    set_openai_key(db, user_id, openai_api_key)


def set_ai_preference_controller(db: Session, user_id: str, ai_preference: str) -> None:
    """Set user AI preference: off, my_key, or hosted."""
    from app.modules.users.repositories import set_ai_preference
    set_ai_preference(db, user_id, ai_preference)


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
