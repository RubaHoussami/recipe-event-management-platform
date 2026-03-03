"""AI parse orchestration: call services, return schemas. Uses stored OpenAI key when configured."""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.modules.ai.schemas import (
    ParseEventResponse,
    ParseRecipeResponse,
    SuggestRecipesResponse,
)
from app.modules.ai.services import (
    assign_cuisine_with_openai,
    parse_event,
    parse_recipe,
    suggest_recipes_with_openai,
)
from app.modules.recipe_shares.services import can_edit_recipe
from app.modules.recipes.repositories import get_recipe_by_id, update_recipe
from app.modules.recipes.schemas import RecipeResponse
from app.modules.users.repositories import get_openai_key_plain


def parse_recipe_controller(
    db: Session,
    current_user_id: uuid.UUID,
    free_text: str,
    use_openai: bool = False,
) -> ParseRecipeResponse:
    openai_api_key = get_openai_key_plain(db, current_user_id) if use_openai else None
    return parse_recipe(free_text, use_openai=bool(openai_api_key), openai_api_key=openai_api_key)


def parse_event_controller(
    db: Session,
    current_user_id: uuid.UUID,
    free_text: str,
    use_openai: bool = False,
) -> ParseEventResponse:
    openai_api_key = get_openai_key_plain(db, current_user_id) if use_openai else None
    return parse_event(free_text, use_openai=bool(openai_api_key), openai_api_key=openai_api_key)


def assign_cuisine_controller(
    db: Session,
    recipe_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> RecipeResponse:
    openai_api_key = get_openai_key_plain(db, current_user_id)
    if not openai_api_key:
        raise ForbiddenError("OpenAI key not configured. Add your key in settings (PATCH /auth/me/ai-key).")
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise NotFoundError("Recipe not found")
    if not can_edit_recipe(db, recipe_id, current_user_id):
        raise ForbiddenError("Not allowed to edit this recipe")
    recipe_text = f"Title: {recipe.title}\n"
    if recipe.description:
        recipe_text += f"Description: {recipe.description}\n"
    recipe_text += "Ingredients: " + ", ".join(recipe.ingredients or []) + "\n"
    recipe_text += "Steps: " + " | ".join(recipe.steps or [])
    cuisine = assign_cuisine_with_openai(recipe_text, openai_api_key)
    update_recipe(db, recipe, cuisine=cuisine)
    return RecipeResponse.model_validate(recipe)


def suggest_recipes_controller(db: Session, current_user_id: uuid.UUID, cuisine: str) -> SuggestRecipesResponse:
    openai_api_key = get_openai_key_plain(db, current_user_id)
    if not openai_api_key:
        raise ForbiddenError("OpenAI key not configured. Add your key in settings (PATCH /auth/me/ai-key).")
    return suggest_recipes_with_openai(cuisine, openai_api_key)
