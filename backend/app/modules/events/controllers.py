"""Event orchestration: permission checks, call repos, map ORM -> schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.modules.events.repositories import (
    create_event,
    delete_event,
    get_event_by_id,
    list_events,
    update_event,
)
from app.modules.events.schemas import EventCreate, EventResponse, EventUpdate


def list_events_controller(
    db: Session,
    owner_id: uuid.UUID,
    q: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[EventResponse], int]:
    items, total = list_events(
        db,
        owner_id=owner_id,
        q=q,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return [EventResponse.model_validate(e) for e in items], total


def get_event_controller(db: Session, event_id: uuid.UUID, current_user_id: uuid.UUID) -> EventResponse:
    event = get_event_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to access this event")
    return EventResponse.model_validate(event)


def create_event_controller(
    db: Session,
    owner_id: uuid.UUID,
    body: EventCreate,
) -> EventResponse:
    event = create_event(
        db,
        owner_id=owner_id,
        title=body.title,
        description=body.description,
        location=body.location,
        start_time=body.start_time,
        end_time=body.end_time,
    )
    return EventResponse.model_validate(event)


def update_event_controller(
    db: Session,
    event_id: uuid.UUID,
    current_user_id: uuid.UUID,
    body: EventUpdate,
) -> EventResponse:
    event = get_event_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to edit this event")
    update_event(
        db,
        event,
        title=body.title,
        description=body.description,
        location=body.location,
        start_time=body.start_time,
        end_time=body.end_time,
    )
    return EventResponse.model_validate(event)


def delete_event_controller(
    db: Session,
    event_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> None:
    event = get_event_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to delete this event")
    delete_event(db, event)
