"""Notifications routes: list, mark read, mark all read."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.notifications.repositories import get_notifications_for_user, mark_all_read, mark_read
from app.modules.notifications.schemas import NotificationResponse
from app.modules.users.models import User

router = APIRouter()


@router.get(
    "/",
    response_model=list[NotificationResponse],
    summary="List my notifications",
)
def list_my_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    notifications = get_notifications_for_user(db, current_user.id)
    return [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            body=n.body,
            link=n.link,
            read_at=n.read_at.isoformat() if n.read_at else None,
            created_at=n.created_at.isoformat(),
        )
        for n in notifications
    ]


@router.post(
    "/read-all",
    status_code=204,
    summary="Mark all notifications as read",
)
def mark_all_read_route(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    mark_all_read(db, current_user.id)


@router.post(
    "/{notification_id}/read",
    status_code=204,
    summary="Mark notification as read",
)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    mark_read(db, notification_id, current_user.id)
