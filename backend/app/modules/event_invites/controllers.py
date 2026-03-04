"""Event invite orchestration: permission checks, token validation, respond binding."""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.modules.event_invites.repositories import (
    create_invite,
    delete_invite,
    get_invite_by_id,
    get_invite_by_event_and_email,
    get_invite_by_token,
    get_invites_by_event_id,
    get_invites_for_user,
    update_invite_status,
)
from app.modules.event_invites.schemas import (
    AttendeeItem,
    AttendeesResponse,
    EventSummary,
    InviteResponse,
    MyInviteDetailResponse,
    MyInviteWithEvent,
)
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
    if invited_user_id and event:
        from app.modules.notifications.repositories import create_notification
        owner = get_user_by_id(db, event.owner_id)
        inviter_name = owner.name if owner else "Someone"
        create_notification(
            db,
            invited_user_id,
            type="event_invite",
            title="Event invitation",
            body=f"{inviter_name} invited you to \"{event.title}\".",
            link=f"/dashboard/invites/respond/{token}",
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
    event = get_event_by_id(db, invite.event_id)
    if event:
        from app.modules.notifications.repositories import create_notification
        accepter = get_user_by_id(db, current_user_id)
        accepter_name = accepter.name if accepter else current_user_email
        if status == "accepted":
            create_notification(
                db,
                event.owner_id,
                type="event_invite_accepted",
                title="Event invite accepted",
                body=f"{accepter_name} accepted your invite to \"{event.title}\".",
                link=f"/dashboard/events/{event.id}",
            )
        elif status == "declined":
            create_notification(
                db,
                event.owner_id,
                type="event_invite_declined",
                title="Event invite declined",
                body=f"{accepter_name} declined your invite to \"{event.title}\".",
                link=f"/dashboard/events/{event.id}",
            )
        elif status == "maybe":
            create_notification(
                db,
                event.owner_id,
                type="event_invite_maybe",
                title="Event invite: maybe",
                body=f"{accepter_name} said maybe to your invite to \"{event.title}\".",
                link=f"/dashboard/events/{event.id}",
            )
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


def delete_invite_controller(
    db: Session,
    event_id: uuid.UUID,
    invite_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> None:
    event = get_event_by_id(db, event_id)
    if not event:
        raise NotFoundError("Event not found")
    if event.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to remove invites for this event")
    invite = get_invite_by_id(db, invite_id)
    if not invite or invite.event_id != event_id:
        raise NotFoundError("Invite not found")
    delete_invite(db, invite)


def list_my_invites_controller(
    db: Session,
    current_user_id: uuid.UUID,
    current_user_email: str,
    limit: int = 50,
    offset: int = 0,
) -> list[MyInviteWithEvent]:
    """List event invites for the current user (invitee)."""
    invites = get_invites_for_user(db, current_user_id, current_user_email, limit=limit, offset=offset)
    result: list[MyInviteWithEvent] = []
    for inv in invites:
        event = get_event_by_id(db, inv.event_id)
        if not event:
            continue
        result.append(
            MyInviteWithEvent(
                invite=InviteResponse.model_validate(inv),
                event=EventSummary(
                    id=event.id,
                    title=event.title,
                    start_time=event.start_time,
                    end_time=event.end_time,
                    location=event.location,
                ),
            )
        )
    return result


def get_my_invite_by_token_controller(
    db: Session,
    token: str,
    current_user_id: str,
    current_user_email: str,
) -> MyInviteDetailResponse:
    """Get invite by token for the current user (for respond page). 404 if not found/expired, 403 if not for this user."""
    invite = validate_token_for_respond(db, token)
    if not invite:
        raise NotFoundError("Invite not found or expired")
    if not user_can_respond_to_invite(invite, current_user_id, current_user_email):
        raise ForbiddenError("This invite is not for you")
    event = get_event_by_id(db, invite.event_id)
    if not event:
        raise NotFoundError("Event not found")
    return MyInviteDetailResponse(
        invite=InviteResponse.model_validate(invite),
        event=EventResponse.model_validate(event),
    )
