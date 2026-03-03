"""Event invite DB access."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.event_invites.models import EventInvite
from app.modules.events.models import Event
from app.modules.users.models import User

if TYPE_CHECKING:
    pass


def create_invite(
    db: Session,
    event_id: uuid.UUID,
    invited_email: str,
    invited_user_id: uuid.UUID | None,
    token: str,
    expires_at: datetime,
) -> EventInvite:
    inv = EventInvite(
        event_id=event_id,
        invited_email=invited_email.strip().lower(),
        invited_user_id=invited_user_id,
        token=token,
        expires_at=expires_at,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


def get_invite_by_token(db: Session, token: str) -> EventInvite | None:
    return db.execute(select(EventInvite).where(EventInvite.token == token)).scalar_one_or_none()


def get_invites_by_event_id(db: Session, event_id: uuid.UUID) -> list[EventInvite]:
    eid = event_id if isinstance(event_id, uuid.UUID) else uuid.UUID(event_id)
    stmt = select(EventInvite).where(EventInvite.event_id == eid)
    return list(db.execute(stmt).scalars().all())


def update_invite_status(db: Session, invite: EventInvite, status: str) -> EventInvite:
    invite.status = status
    db.commit()
    db.refresh(invite)
    return invite


def get_invite_by_event_and_email(db: Session, event_id: uuid.UUID, email: str) -> EventInvite | None:
    return db.execute(
        select(EventInvite).where(
            EventInvite.event_id == event_id,
            EventInvite.invited_email == email.strip().lower(),
        )
    ).scalar_one_or_none()
