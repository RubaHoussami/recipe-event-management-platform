"""AI parse orchestration: call services, return schemas. Uses preference (off / my_key / hosted) and rate limit."""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.rate_limit import get_ai_rate_limiter
from app.modules.ai.schemas import (
    ParseEventResponse,
    ParseRecipeResponse,
    SuggestRecipesResponse,
)
from app.modules.ai.services import (
    assign_cuisine_with_provider,
    get_effective_ai,
    parse_event_with_provider,
    parse_recipe_with_provider,
    suggest_recipes_with_provider,
)
from app.modules.ai.providers import MockAIProvider
from app.modules.recipe_shares.services import can_edit_recipe
from app.modules.recipes.repositories import get_recipe_by_id, update_recipe
from app.modules.recipes.schemas import RecipeResponse


def _check_rate_limit(user_id: uuid.UUID, rate_limited: bool) -> None:
    if not rate_limited:
        return
    limiter = get_ai_rate_limiter()
    try:
        limiter.check(str(user_id))
    except PermissionError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=429, detail=str(e)) from e


def parse_recipe_controller(
    db: Session,
    current_user_id: uuid.UUID,
    free_text: str,
    use_openai: bool = False,
) -> ParseRecipeResponse:
    parse_provider, _chat_provider, rate_limited = get_effective_ai(db, str(current_user_id))
    if use_openai and rate_limited:
        _check_rate_limit(current_user_id, rate_limited)
    provider = parse_provider if use_openai else MockAIProvider()
    try:
        return parse_recipe_with_provider(provider, free_text)
    except Exception as e:
        err_msg = str(e).strip() or "AI request failed"
        if "api key" in err_msg.lower() or "401" in err_msg or "authentication" in err_msg.lower():
            raise ForbiddenError("Invalid or expired API key. Check Settings.") from e
        raise ForbiddenError(f"Could not parse recipe: {err_msg[:200]}") from e


def parse_event_controller(
    db: Session,
    current_user_id: uuid.UUID,
    free_text: str,
    use_openai: bool = False,
) -> ParseEventResponse:
    parse_provider, _chat_provider, rate_limited = get_effective_ai(db, str(current_user_id))
    if use_openai and rate_limited:
        _check_rate_limit(current_user_id, rate_limited)
    provider = parse_provider if use_openai else MockAIProvider()
    try:
        return parse_event_with_provider(provider, free_text)
    except Exception as e:
        err_msg = str(e).strip() or "AI request failed"
        if "api key" in err_msg.lower() or "401" in err_msg or "authentication" in err_msg.lower():
            raise ForbiddenError("Invalid or expired API key. Check Settings.") from e
        raise ForbiddenError(f"Could not parse event: {err_msg[:200]}") from e


def assign_cuisine_controller(
    db: Session,
    recipe_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> RecipeResponse:
    _parse_provider, chat_provider, rate_limited = get_effective_ai(db, str(current_user_id))
    if not chat_provider:
        raise ForbiddenError("AI not enabled. Choose “My API key” or “Use hosted model” in Settings.")
    _check_rate_limit(current_user_id, rate_limited)
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
    try:
        cuisine = assign_cuisine_with_provider(chat_provider, recipe_text)
    except Exception as e:
        err_msg = str(e).strip() or "AI request failed"
        if "api key" in err_msg.lower() or "401" in err_msg or "authentication" in err_msg.lower():
            raise ForbiddenError("Invalid or expired API key. Check Settings.") from e
        raise ForbiddenError(f"Could not detect cuisine: {err_msg[:200]}") from e
    update_recipe(db, recipe, cuisine=cuisine)
    return RecipeResponse.model_validate(recipe)


def suggest_recipes_controller(db: Session, current_user_id: uuid.UUID, cuisine: str) -> SuggestRecipesResponse:
    _parse_provider, chat_provider, rate_limited = get_effective_ai(db, str(current_user_id))
    if not chat_provider:
        raise ForbiddenError("AI not enabled. Choose “My API key” or “Use hosted model” in Settings.")
    _check_rate_limit(current_user_id, rate_limited)
    try:
        return suggest_recipes_with_provider(chat_provider, cuisine)
    except Exception as e:
        err_msg = str(e).strip() or "AI request failed"
        if "api key" in err_msg.lower() or "401" in err_msg or "authentication" in err_msg.lower():
            raise ForbiddenError("Invalid or expired API key. Check Settings.") from e
        raise ForbiddenError(f"Could not get suggestions: {err_msg[:200]}") from e
