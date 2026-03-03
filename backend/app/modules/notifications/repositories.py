"""Notifications DB access."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    *,
    type: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> Notification:
    n = Notification(user_id=user_id, type=type, title=title, body=body, link=link)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def get_notifications_for_user(
    db: Session,
    user_id: uuid.UUID,
    *,
    limit: int = 50,
    offset: int = 0,
) -> list[Notification]:
    q = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.execute(q).scalars().all())


def mark_read(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    from datetime import timezone
    n = db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    ).scalar_one_or_none()
    if not n:
        return False
    n.read_at = datetime.now(timezone.utc)
    db.commit()
    return True


def mark_all_read(db: Session, user_id: uuid.UUID) -> None:
    from datetime import timezone
    from sqlalchemy import update
    db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()
