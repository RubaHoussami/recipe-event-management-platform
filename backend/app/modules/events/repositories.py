"""Event DB access and query encapsulation."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.events.models import Event

if TYPE_CHECKING:
    pass


def create_event(
    db: Session,
    owner_id: uuid.UUID,
    title: str,
    start_time: datetime,
    description: str | None = None,
    location: str | None = None,
    end_time: datetime | None = None,
) -> Event:
    event = Event(
        owner_id=owner_id,
        title=title,
        description=description,
        location=location,
        start_time=start_time,
        end_time=end_time,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_event_by_id(db: Session, event_id: uuid.UUID | str) -> Event | None:
    eid = event_id if isinstance(event_id, uuid.UUID) else uuid.UUID(event_id)
    return db.execute(select(Event).where(Event.id == eid)).scalar_one_or_none()


def list_events(
    db: Session,
    owner_id: uuid.UUID,
    q: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Event], int]:
    base = select(Event).where(Event.owner_id == owner_id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        base = base.where(
            or_(
                Event.title.ilike(term),
                Event.description.ilike(term),
                Event.location.ilike(term),
            )
        )
    if date_from is not None:
        base = base.where(Event.start_time >= date_from)
    if date_to is not None:
        base = base.where(Event.start_time <= date_to)
    total = db.execute(select(func.count()).select_from(base.subquery())).scalar() or 0
    stmt = base.order_by(Event.start_time.asc()).limit(limit).offset(offset)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def update_event(
    db: Session,
    event: Event,
    title: str | None = None,
    description: str | None = None,
    location: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
) -> Event:
    if title is not None:
        event.title = title
    if description is not None:
        event.description = description
    if location is not None:
        event.location = location
    if start_time is not None:
        event.start_time = start_time
    if end_time is not None:
        event.end_time = end_time
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event: Event) -> None:
    db.delete(event)
    db.commit()
