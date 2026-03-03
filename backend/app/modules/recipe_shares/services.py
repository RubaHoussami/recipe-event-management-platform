"""Recipe share domain logic: resolve email to user, permission checks."""
from __future__ import annotations

import uuid
from sqlalchemy.orm import Session

from app.modules.recipe_shares.repositories import get_share_for_recipe_and_user
from app.modules.recipes.repositories import get_recipe_by_id
from app.modules.users.repositories import get_user_by_email, get_user_by_id


def resolve_shared_with_user_id(
    db: Session,
    shared_with_email: str | None,
    shared_with_user_id: uuid.UUID | None,
) -> uuid.UUID | None:
    """Return user id from email or user_id. Returns None if not found."""
    if shared_with_user_id:
        user = get_user_by_id(db, shared_with_user_id)
        return user.id if user else None
    if shared_with_email and shared_with_email.strip():
        user = get_user_by_email(db, shared_with_email.strip())
        return user.id if user else None
    return None


def can_view_recipe(db: Session, recipe_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """True if user is owner or has any share."""
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        return False
    if recipe.owner_id == user_id:
        return True
    share = get_share_for_recipe_and_user(db, recipe_id, user_id)
    return share is not None


def can_edit_recipe(db: Session, recipe_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """True if user is owner or has editor share."""
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        return False
    if recipe.owner_id == user_id:
        return True
    share = get_share_for_recipe_and_user(db, recipe_id, user_id)
    return share is not None and share.permission == "editor"
