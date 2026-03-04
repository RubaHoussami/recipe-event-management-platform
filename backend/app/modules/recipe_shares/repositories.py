"""Recipe share DB access."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.recipe_shares.models import RecipeShare
from app.modules.recipes.models import Recipe

if TYPE_CHECKING:
    pass


def create_share(
    db: Session,
    recipe_id: uuid.UUID,
    shared_with_user_id: uuid.UUID,
    permission: str,
) -> RecipeShare:
    share = RecipeShare(
        recipe_id=recipe_id,
        shared_with_user_id=shared_with_user_id,
        permission=permission,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share


def get_shares_by_recipe_id(db: Session, recipe_id: uuid.UUID) -> list[RecipeShare]:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    stmt = select(RecipeShare).where(RecipeShare.recipe_id == rid)
    return list(db.execute(stmt).scalars().all())


def get_share_by_id(db: Session, share_id: uuid.UUID) -> RecipeShare | None:
    sid = share_id if isinstance(share_id, uuid.UUID) else uuid.UUID(share_id)
    return db.execute(select(RecipeShare).where(RecipeShare.id == sid)).scalar_one_or_none()


def delete_share(db: Session, share: RecipeShare) -> None:
    db.delete(share)
    db.commit()


def get_share_for_recipe_and_user(
    db: Session,
    recipe_id: uuid.UUID,
    user_id: uuid.UUID,
) -> RecipeShare | None:
    return db.execute(
        select(RecipeShare).where(
            RecipeShare.recipe_id == recipe_id,
            RecipeShare.shared_with_user_id == user_id,
        )
    ).scalar_one_or_none()


def get_recipes_shared_with_user(
    db: Session,
    user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[tuple[Recipe, str]], int]:
    """Recipes shared with this user (via recipe_shares), with permission. Returns list of (Recipe, permission)."""
    uid = user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(user_id)
    subq = (
        select(RecipeShare.recipe_id, RecipeShare.permission)
        .where(RecipeShare.shared_with_user_id == uid)
    )
    subq_alias = subq.subquery()
    stmt = (
        select(Recipe, subq_alias.c.permission)
        .join(subq_alias, Recipe.id == subq_alias.c.recipe_id)
        .order_by(Recipe.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = list(db.execute(stmt).all())
    count_stmt = select(func.count()).select_from(
        select(RecipeShare.recipe_id).where(RecipeShare.shared_with_user_id == uid).subquery()
    )
    total = db.execute(count_stmt).scalar() or 0
    return rows, total
