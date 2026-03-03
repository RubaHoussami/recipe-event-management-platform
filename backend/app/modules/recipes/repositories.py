"""Recipe DB access and query encapsulation."""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.recipes.models import Recipe

if TYPE_CHECKING:
    pass


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
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Recipe], int]:
    base = select(Recipe).where(Recipe.owner_id == owner_id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        base = base.where(or_(Recipe.title.ilike(term), Recipe.description.ilike(term)))
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
