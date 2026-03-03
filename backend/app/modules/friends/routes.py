"""Friends routes: list, add, remove. People search."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.friends.repositories import add_friend, get_friends_for_user, remove_friend, search_users
from app.modules.friends.schemas import AddFriendRequest, FriendResponse, PersonResponse
from app.modules.users.models import User
from app.modules.users.repositories import get_user_by_email

router = APIRouter()


@router.get(
    "/",
    response_model=list[FriendResponse],
    summary="List my friends",
)
def list_my_friends(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    pairs = get_friends_for_user(db, current_user.id)
    return [
        FriendResponse(
            friend_id=str(friend_user.id),
            friend_email=friend_user.email,
            friend_name=friend_user.name,
            friend_avatar_url=friend_user.avatar_url,
            created_at=f.created_at.isoformat(),
        )
        for f, friend_user in pairs
    ]


@router.post(
    "/",
    response_model=FriendResponse,
    status_code=201,
    summary="Add friend by email",
)
def add_friend_by_email(
    body: AddFriendRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    other = get_user_by_email(db, body.email)
    if not other:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    if other.id == current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot add yourself")
    f = add_friend(db, current_user.id, other.id)
    return FriendResponse(
        friend_id=str(other.id),
        friend_email=other.email,
        friend_name=other.name,
        friend_avatar_url=other.avatar_url,
        created_at=f.created_at.isoformat(),
    )


@router.get(
    "/people",
    response_model=list[PersonResponse],
    summary="Search people (for adding friends)",
)
def list_people(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    q: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    users = search_users(db, exclude_user_id=current_user.id, q=q, limit=limit, offset=offset)
    return [
        PersonResponse(id=str(u.id), email=u.email, name=u.name, avatar_url=u.avatar_url)
        for u in users
    ]


@router.delete(
    "/{friend_id}",
    status_code=204,
    summary="Remove friend",
)
def remove_friend_route(
    friend_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    remove_friend(db, current_user.id, friend_id)
