"""Event routes: CRUD + list/search (all protected)."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.events.controllers import (
    create_event_controller,
    delete_event_controller,
    get_event_controller,
    list_events_controller,
    update_event_controller,
)
from app.modules.events.schemas import EventCreate, EventResponse, EventUpdate
from app.modules.users.models import User

router = APIRouter()


@router.post(
    "/",
    response_model=EventResponse,
    summary="Create event",
    status_code=status.HTTP_201_CREATED,
    responses={201: {"description": "Created"}, 401: {"description": "Unauthorized"}, 422: {"description": "Validation error"}},
    tags=["Events"],
)
def create_event(
    body: EventCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return create_event_controller(db, owner_id=current_user.id, body=body)


@router.get(
    "/",
    response_model=PaginatedResponse[EventResponse],
    summary="List events",
    description="List current user's events with optional search and date range.",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}},
    tags=["Events"],
)
def list_events(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    q: str | None = Query(None, description="Search in title/description/location"),
    date_from: datetime | None = Query(None, description="Filter events from this datetime (ISO)"),
    date_to: datetime | None = Query(None, description="Filter events until this datetime (ISO)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = list_events_controller(
        db,
        owner_id=current_user.id,
        q=q,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Get event",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Events"],
)
def get_event(
    event_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return get_event_controller(
        db,
        event_id=event_id,
        current_user_id=current_user.id,
        current_user_email=getattr(current_user, "email", None),
    )


@router.patch(
    "/{event_id}",
    response_model=EventResponse,
    summary="Update event",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}, 422: {"description": "Validation error"}},
    tags=["Events"],
)
def update_event(
    event_id: uuid.UUID,
    body: EventUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return update_event_controller(db, event_id=event_id, current_user_id=current_user.id, body=body)


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete event",
    responses={204: {"description": "Deleted"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Events"],
)
def delete_event(
    event_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    delete_event_controller(db, event_id=event_id, current_user_id=current_user.id)
