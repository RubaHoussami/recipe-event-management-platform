"""Event invite orchestration: permission checks, token validation, respond binding."""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.modules.event_invites.repositories import (
    create_invite,
    get_invite_by_event_and_email,
    get_invites_by_event_id,
    update_invite_status,
)
from app.modules.event_invites.schemas import AttendeeItem, AttendeesResponse, InviteResponse
from app.modules.event_invites.services import (
    default_expires_at,
    generate_invite_token,
    resolve_invited_user_id,
    user_can_respond_to_invite,
    validate_token_for_respond,
)
from app.modules.events.repositories import get_event_by_id
from app.modules.users.repositories import get_user_by_id


def create_invite_controller(
    db: Session,
    event_id: uuid.UUID,
    current_user_id: uuid.UUID,
    invited_email: str,
) -> InviteResponse:
    event = get_event_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to invite to this event")
    normalized_email, invited_user_id = resolve_invited_user_id(db, invited_email)
    existing = get_invite_by_event_and_email(db, event_id, normalized_email)
    if existing:
        raise ConflictError("Already invited this email to the event")
    token = generate_invite_token()
    expires_at = default_expires_at()
    inv = create_invite(
        db,
        event_id=event_id,
        invited_email=normalized_email,
        invited_user_id=invited_user_id,
        token=token,
        expires_at=expires_at,
    )
    return InviteResponse.model_validate(inv)


def list_invites_controller(
    db: Session,
    event_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> list[InviteResponse]:
    event = get_event_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to list invites for this event")
    invites = get_invites_by_event_id(db, event_id)
    return [InviteResponse.model_validate(i) for i in invites]


def respond_controller(
    db: Session,
    token: str,
    current_user_id: str,
    current_user_email: str,
    status: str,
) -> InviteResponse:
    invite = validate_token_for_respond(db, token)
    if not invite:
        raise NotFoundError("Invite not found or expired")
    if not user_can_respond_to_invite(invite, current_user_id, current_user_email):
        raise ForbiddenError("This invite is not for you")
    updated = update_invite_status(db, invite, status)
    return InviteResponse.model_validate(updated)


def get_attendees_controller(
    db: Session,
    event_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> AttendeesResponse:
    event = get_event_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to view attendees for this event")
    owner = get_user_by_id(db, event.owner_id)
    if not owner:
        raise NotFoundError("Event owner not found")
    owner_item = AttendeeItem(
        email=owner.email,
        name=owner.name,
        user_id=owner.id,
        status="owner",
    )
    invites = get_invites_by_event_id(db, event_id)
    invitees: list[AttendeeItem] = []
    for inv in invites:
        name = None
        if inv.invited_user_id:
            u = get_user_by_id(db, inv.invited_user_id)
            if u:
                name = u.name
        invitees.append(
            AttendeeItem(
                email=inv.invited_email,
                name=name,
                user_id=inv.invited_user_id,
                status=inv.status,
            )
        )
    return AttendeesResponse(owner=owner_item, invitees=invitees)
