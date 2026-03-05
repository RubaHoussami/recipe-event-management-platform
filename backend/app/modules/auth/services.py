"""Auth domain logic: login verification, token creation, OTP."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.email import send_email
from app.core.exceptions import ForbiddenError
from app.core.security import create_access_token, verify_password
from app.modules.users.repositories import get_user_by_email, set_email_otp


def login_user(db: Session, email: str, password: str) -> tuple[str, str]:
    """Verify credentials and return (access_token, user_id). Raises ForbiddenError if invalid."""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise ForbiddenError("Invalid email or password")
    token = create_access_token(subject=str(user.id))
    return token, str(user.id)


def generate_and_send_otp(db: Session, user_id: str, email: str) -> str:
    """Generate 6-digit OTP, store it, send email. Returns the OTP (for dev/logging if needed)."""
    settings = get_settings()
    code = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
    set_email_otp(db, user_id, code, expires_at)
    subject = "Verify your email – Feast & Fest"
    body = f"Your verification code is: {code}\n\nIt expires in {settings.otp_expire_minutes} minutes.\n\nIf you didn't request this, you can ignore this email."
    send_email(email, subject, body)
    return code
