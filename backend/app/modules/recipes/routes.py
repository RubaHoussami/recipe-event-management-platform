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
    add_status_controller,
    add_tag_controller,
    create_recipe_controller,
    delete_recipe_controller,
    get_recipe_controller,
    list_recipes_controller,
    remove_status_controller,
    remove_tag_controller,
    update_recipe_controller,
)
from app.modules.recipes.schemas import RecipeCreate, RecipeResponse, RecipeStatusAdd, RecipeTagAdd, RecipeUpdate
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
    tag: str | None = Query(None, description="Filter by tag"),
    status: str | None = Query(None, description="Filter by status: favorite, to_try, made_before"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = list_recipes_controller(
        db, owner_id=current_user.id, q=q, tag=tag, status=status, limit=limit, offset=offset
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


@router.post(
    "/{recipe_id}/tags",
    summary="Add tag to recipe",
    status_code=status.HTTP_201_CREATED,
    responses={201: {"description": "Tag added"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}, 409: {"description": "Tag already exists"}},
    tags=["Recipes"],
)
def add_tag(
    recipe_id: uuid.UUID,
    body: RecipeTagAdd,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return add_tag_controller(db, recipe_id=recipe_id, current_user_id=current_user.id, tag=body.tag)


@router.delete(
    "/{recipe_id}/tags/{tag:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove tag from recipe",
    responses={204: {"description": "Tag removed"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Recipes"],
)
def remove_tag(
    recipe_id: uuid.UUID,
    tag: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    remove_tag_controller(db, recipe_id=recipe_id, current_user_id=current_user.id, tag=tag)


@router.post(
    "/{recipe_id}/statuses",
    summary="Add status to recipe",
    status_code=status.HTTP_201_CREATED,
    responses={201: {"description": "Status added"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}, 409: {"description": "Status already set"}},
    tags=["Recipes"],
)
def add_status(
    recipe_id: uuid.UUID,
    body: RecipeStatusAdd,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return add_status_controller(db, recipe_id=recipe_id, current_user_id=current_user.id, status=body.status)


@router.delete(
    "/{recipe_id}/statuses/{status}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove status from recipe",
    responses={204: {"description": "Status removed"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["Recipes"],
)
def remove_status(
    recipe_id: uuid.UUID,
    status: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    remove_status_controller(db, recipe_id=recipe_id, current_user_id=current_user.id, status=status)
