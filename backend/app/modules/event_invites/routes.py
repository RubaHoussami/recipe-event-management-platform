"""Event invite routes: create/list invites, respond by token, attendees."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.event_invites.controllers import (
    create_invite_controller,
    get_attendees_controller,
    list_invites_controller,
    respond_controller,
)
from app.modules.event_invites.schemas import AttendeesResponse, InviteCreate, InviteRespondRequest, InviteResponse
from app.modules.users.models import User

router = APIRouter()
invites_router = APIRouter()


@router.post(
    "/{event_id}/invites",
    response_model=InviteResponse,
    summary="Invite by email",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Invite created"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Event not found"},
        409: {"description": "Already invited"},
        422: {"description": "Validation error"},
    },
    tags=["Invites"],
)
def create_invite(
    event_id: uuid.UUID,
    body: InviteCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return create_invite_controller(
        db, event_id=event_id, current_user_id=current_user.id, invited_email=body.invited_email
    )


@router.get(
    "/{event_id}/invites",
    response_model=list[InviteResponse],
    summary="List invites for event",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Invites"],
)
def list_invites(
    event_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return list_invites_controller(db, event_id=event_id, current_user_id=current_user.id)


@router.get(
    "/{event_id}/attendees",
    response_model=AttendeesResponse,
    summary="Get event attendees (owner + invitees with status)",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Invites"],
)
def get_attendees(
    event_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return get_attendees_controller(db, event_id=event_id, current_user_id=current_user.id)


@invites_router.post(
    "/{token}/respond",
    response_model=InviteResponse,
    summary="Respond to invitation (accepted/declined/maybe)",
    description="Protected. Token must be valid, not expired, and must match the authenticated user (email or user id).",
    responses={
        200: {"description": "Updated"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden - invite is for another user"},
        404: {"description": "Invite not found or expired"},
        422: {"description": "Validation error"},
    },
    tags=["Invites"],
)
def respond_to_invite(
    token: str,
    body: InviteRespondRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return respond_controller(
        db,
        token=token,
        current_user_id=str(current_user.id),
        current_user_email=current_user.email,
        status=body.status,
    )
