"""Recipe orchestration: permission checks, call repos, map ORM -> schemas."""
from __future__ import annotations

import uuid
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.modules.recipes.repositories import (
    create_recipe,
    delete_recipe,
    get_recipe_by_id,
    list_recipes,
    update_recipe,
)
from app.modules.recipes.schemas import RecipeCreate, RecipeResponse, RecipeUpdate


def list_recipes_controller(
    db: Session,
    owner_id: uuid.UUID,
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[RecipeResponse], int]:
    items, total = list_recipes(db, owner_id=owner_id, q=q, limit=limit, offset=offset)
    return [RecipeResponse.model_validate(r) for r in items], total


def get_recipe_controller(db: Session, recipe_id: uuid.UUID, current_user_id: uuid.UUID) -> RecipeResponse:
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise NotFoundError("Recipe not found")
    if recipe.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to access this recipe")
    return RecipeResponse.model_validate(recipe)


def create_recipe_controller(
    db: Session,
    owner_id: uuid.UUID,
    body: RecipeCreate,
) -> RecipeResponse:
    recipe = create_recipe(
        db,
        owner_id=owner_id,
        title=body.title,
        description=body.description,
        ingredients=body.ingredients,
        steps=body.steps,
    )
    return RecipeResponse.model_validate(recipe)


def update_recipe_controller(
    db: Session,
    recipe_id: uuid.UUID,
    current_user_id: uuid.UUID,
    body: RecipeUpdate,
) -> RecipeResponse:
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise NotFoundError("Recipe not found")
    if recipe.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to edit this recipe")
    update_recipe(
        db,
        recipe,
        title=body.title,
        description=body.description,
        ingredients=body.ingredients,
        steps=body.steps,
    )
    return RecipeResponse.model_validate(recipe)


def delete_recipe_controller(
    db: Session,
    recipe_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> None:
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise NotFoundError("Recipe not found")
    if recipe.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to delete this recipe")
    delete_recipe(db, recipe)
