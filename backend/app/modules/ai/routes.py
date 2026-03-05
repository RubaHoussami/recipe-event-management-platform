"""AI parse routes (protected; Mock or per-request OpenAI). Assign-cuisine and suggest require OpenAI."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.ai.controllers import (
    assign_cuisine_controller,
    parse_event_controller,
    parse_recipe_controller,
    suggest_recipes_controller,
)
from app.modules.ai.schemas import (
    AssignCuisineRequest,
    ParseEventRequest,
    ParseEventResponse,
    ParseRecipeRequest,
    ParseRecipeResponse,
    SuggestRecipesRequest,
    SuggestRecipesResponse,
)
from app.modules.recipes.schemas import RecipeResponse
from app.modules.users.models import User

router = APIRouter()


@router.post(
    "/recipes/parse",
    response_model=ParseRecipeResponse,
    summary="Parse recipe from free text",
    description="Set use_openai=true to use AI (your key or hosted model per Settings). Rate-limited.",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 422: {"description": "Validation error"}, 429: {"description": "Too many requests"}},
    tags=["AI"],
)
def parse_recipe(
    body: ParseRecipeRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return parse_recipe_controller(db, current_user.id, body.free_text, use_openai=body.use_openai)


@router.post(
    "/events/parse",
    response_model=ParseEventResponse,
    summary="Parse event from free text",
    description="Set use_openai=true to use AI (your key or hosted model per Settings). Rate-limited.",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 422: {"description": "Validation error"}, 429: {"description": "Too many requests"}},
    tags=["AI"],
)
def parse_event(
    body: ParseEventRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return parse_event_controller(db, current_user.id, body.free_text, use_openai=body.use_openai)


@router.post(
    "/recipes/assign-cuisine",
    response_model=RecipeResponse,
    summary="Assign cuisine to recipe (AI required)",
    description="Uses your AI preference (my key or hosted model). Configure in Settings.",
    responses={
        200: {"description": "Recipe updated with cuisine"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden or AI not enabled"},
        404: {"description": "Recipe not found"},
        422: {"description": "Validation error"},
        429: {"description": "Too many requests"},
    },
    tags=["AI"],
)
def assign_cuisine(
    body: AssignCuisineRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return assign_cuisine_controller(db, recipe_id=body.recipe_id, current_user_id=current_user.id)


@router.post(
    "/recipes/suggest",
    response_model=SuggestRecipesResponse,
    summary="Suggest recipes by cuisine (AI required)",
    description="Uses your AI preference (my key or hosted model). Configure in Settings.",
    responses={
        200: {"description": "Suggestions"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden or AI not enabled"},
        422: {"description": "Validation error"},
        429: {"description": "Too many requests"},
    },
    tags=["AI"],
)
def suggest_recipes(
    body: SuggestRecipesRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return suggest_recipes_controller(db, current_user.id, body.cuisine)
