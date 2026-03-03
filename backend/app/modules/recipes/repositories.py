"""Recipe DB access and query encapsulation."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.recipes.models import Recipe, RecipeStatus, RecipeTag

if TYPE_CHECKING:
    pass

RECIPE_STATUSES = frozenset({"favorite", "to_try", "made_before"})


def create_recipe(
    db: Session,
    owner_id: uuid.UUID,
    title: str,
    description: str | None = None,
    ingredients: list[str] | None = None,
    steps: list[str] | None = None,
) -> Recipe:
    recipe = Recipe(
        owner_id=owner_id,
        title=title,
        description=description,
        ingredients=ingredients or [],
        steps=steps or [],
    )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


def get_recipe_by_id(db: Session, recipe_id: uuid.UUID | str) -> Recipe | None:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    return db.execute(select(Recipe).where(Recipe.id == rid)).scalar_one_or_none()


def list_recipes(
    db: Session,
    owner_id: uuid.UUID,
    q: str | None = None,
    tag: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Recipe], int]:
    base = select(Recipe).where(Recipe.owner_id == owner_id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        base = base.where(or_(Recipe.title.ilike(term), Recipe.description.ilike(term)))
    if tag and tag.strip():
        base = base.join(RecipeTag, RecipeTag.recipe_id == Recipe.id).where(RecipeTag.tag == tag.strip())
    if status and status.strip() and status.strip() in RECIPE_STATUSES:
        base = base.join(RecipeStatus, RecipeStatus.recipe_id == Recipe.id).where(RecipeStatus.status == status.strip())
    base = base.distinct()
    total = db.execute(select(func.count()).select_from(base.subquery())).scalar() or 0
    stmt = base.order_by(Recipe.updated_at.desc()).limit(limit).offset(offset)
    items = list(db.execute(stmt).scalars().all())
    return items, total


def update_recipe(
    db: Session,
    recipe: Recipe,
    title: str | None = None,
    description: str | None = None,
    ingredients: list[str] | None = None,
    steps: list[str] | None = None,
) -> Recipe:
    if title is not None:
        recipe.title = title
    if description is not None:
        recipe.description = description
    if ingredients is not None:
        recipe.ingredients = ingredients
    if steps is not None:
        recipe.steps = steps
    db.commit()
    db.refresh(recipe)
    return recipe


def delete_recipe(db: Session, recipe: Recipe) -> None:
    db.delete(recipe)
    db.commit()


# ---------- Recipe tags ----------


def get_recipe_tags(db: Session, recipe_id: uuid.UUID) -> list[RecipeTag]:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    stmt = select(RecipeTag).where(RecipeTag.recipe_id == rid)
    return list(db.execute(stmt).scalars().all())


def add_recipe_tag(db: Session, recipe_id: uuid.UUID, tag: str) -> RecipeTag:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    rt = RecipeTag(recipe_id=rid, tag=tag.strip())
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt


def remove_recipe_tag(db: Session, recipe_id: uuid.UUID, tag: str) -> bool:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    stmt = select(RecipeTag).where(RecipeTag.recipe_id == rid, RecipeTag.tag == tag)
    rt = db.execute(stmt).scalar_one_or_none()
    if rt:
        db.delete(rt)
        db.commit()
        return True
    return False


# ---------- Recipe statuses ----------


def get_recipe_statuses(db: Session, recipe_id: uuid.UUID) -> list[RecipeStatus]:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    stmt = select(RecipeStatus).where(RecipeStatus.recipe_id == rid)
    return list(db.execute(stmt).scalars().all())


def add_recipe_status(db: Session, recipe_id: uuid.UUID, status: str) -> RecipeStatus:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    if status not in RECIPE_STATUSES:
        raise ValueError(f"Invalid status: {status}")
    rs = RecipeStatus(recipe_id=rid, status=status)
    db.add(rs)
    db.commit()
    db.refresh(rs)
    return rs


def remove_recipe_status(db: Session, recipe_id: uuid.UUID, status: str) -> bool:
    rid = recipe_id if isinstance(recipe_id, uuid.UUID) else uuid.UUID(recipe_id)
    stmt = select(RecipeStatus).where(RecipeStatus.recipe_id == rid, RecipeStatus.status == status)
    rs = db.execute(stmt).scalar_one_or_none()
    if rs:
        db.delete(rs)
        db.commit()
        return True
    return False
