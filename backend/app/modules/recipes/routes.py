"""Recipe routes: CRUD + list/search (all protected)."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.recipes.controllers import (
    create_recipe_controller,
    delete_recipe_controller,
    get_recipe_controller,
    list_recipes_controller,
    update_recipe_controller,
)
from app.modules.recipes.schemas import RecipeCreate, RecipeResponse, RecipeUpdate
from app.modules.users.models import User

router = APIRouter()


@router.post(
    "/",
    response_model=RecipeResponse,
    summary="Create recipe",
    status_code=status.HTTP_201_CREATED,
    responses={201: {"description": "Created"}, 401: {"description": "Unauthorized"}, 422: {"description": "Validation error"}},
    tags=["Recipes"],
)
def create_recipe(
    body: RecipeCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return create_recipe_controller(db, owner_id=current_user.id, body=body)


@router.get(
    "/",
    response_model=PaginatedResponse[RecipeResponse],
    summary="List recipes",
    description="List current user's recipes with optional search (q).",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}},
    tags=["Recipes"],
)
def list_recipes(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    q: str | None = Query(None, description="Search in title/description"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = list_recipes_controller(
        db, owner_id=current_user.id, q=q, limit=limit, offset=offset
    )
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get(
    "/{recipe_id}",
    response_model=RecipeResponse,
    summary="Get recipe",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Recipes"],
)
def get_recipe(
    recipe_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return get_recipe_controller(db, recipe_id=recipe_id, current_user_id=current_user.id)


@router.patch(
    "/{recipe_id}",
    response_model=RecipeResponse,
    summary="Update recipe",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}, 422: {"description": "Validation error"}},
    tags=["Recipes"],
)
def update_recipe(
    recipe_id: uuid.UUID,
    body: RecipeUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return update_recipe_controller(db, recipe_id=recipe_id, current_user_id=current_user.id, body=body)


@router.delete(
    "/{recipe_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete recipe",
    responses={204: {"description": "Deleted"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Recipes"],
)
def delete_recipe(
    recipe_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    delete_recipe_controller(db, recipe_id=recipe_id, current_user_id=current_user.id)
