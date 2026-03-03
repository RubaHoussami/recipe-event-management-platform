"""Event invite domain logic: token generation, validation."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.modules.event_invites.models import EventInvite
from app.modules.event_invites.repositories import get_invite_by_token
from app.modules.users.repositories import get_user_by_email


def generate_invite_token() -> str:
    return secrets.token_urlsafe(32)


def default_expires_at(days: int = 7) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


def resolve_invited_user_id(db: Session, email: str):
    """Return (normalized_email, user_id or None)."""
    normalized = email.strip().lower()
    user = get_user_by_email(db, normalized)
    return normalized, user.id if user else None


def validate_token_for_respond(db: Session, token: str) -> EventInvite | None:
    """Return invite if token exists and not expired; else None."""
    invite = get_invite_by_token(db, token)
    if not invite:
        return None
    if datetime.now(timezone.utc) >= invite.expires_at:
        return None
    return invite


def user_can_respond_to_invite(invite: EventInvite, current_user_id: str, current_user_email: str) -> bool:
    """True if current user is the one invited (by user_id or email)."""
    if invite.invited_user_id and str(invite.invited_user_id) == current_user_id:
        return True
    if invite.invited_email and invite.invited_email.lower() == current_user_email.strip().lower():
        return True
    return False
