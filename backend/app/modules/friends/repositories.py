"""Friends DB access."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.modules.friends.models import Friend
from app.modules.users.models import User

if TYPE_CHECKING:
    pass


def get_friends_for_user(db: Session, user_id: uuid.UUID, *, limit: int = 100, offset: int = 0) -> list[tuple[Friend, User]]:
    """Return (Friend, friend User) for user_id."""
    q = (
        select(Friend, User)
        .join(User, Friend.friend_id == User.id)
        .where(Friend.user_id == user_id)
        .order_by(Friend.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = db.execute(q).all()
    return [(r[0], r[1]) for r in rows]


def add_friend(db: Session, user_id: uuid.UUID, friend_id: uuid.UUID) -> Friend:
    """Create friendship (both directions not required; we only store user_id -> friend_id)."""
    f = Friend(user_id=user_id, friend_id=friend_id)
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


def remove_friend(db: Session, user_id: uuid.UUID, friend_id: uuid.UUID) -> None:
    """Remove friendship."""
    found = db.execute(select(Friend).where(Friend.user_id == user_id, Friend.friend_id == friend_id)).scalar_one_or_none()
    if found:
        db.delete(found)
        db.commit()


def is_friend(db: Session, user_id: uuid.UUID, friend_id: uuid.UUID) -> bool:
    return db.execute(
        select(Friend).where(Friend.user_id == user_id, Friend.friend_id == friend_id)
    ).scalar_one_or_none() is not None


def search_users(
    db: Session,
    *,
    exclude_user_id: uuid.UUID,
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[User]:
    """Search users by name or email, excluding exclude_user_id."""
    stmt = select(User).where(User.id != exclude_user_id)
    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                User.email.ilike(term),
                User.name.ilike(term),
            )
        )
    stmt = stmt.order_by(User.name).limit(limit).offset(offset)
    return list(db.execute(stmt).scalars().all())
