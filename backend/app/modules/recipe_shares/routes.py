"""Recipe share routes: CRUD under /recipes/{recipe_id}/shares; GET /shared/recipes."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.recipe_shares.controllers import (
    create_share_controller,
    delete_share_controller,
    list_shares_controller,
    list_shared_recipes_controller,
)
from app.modules.recipe_shares.schemas import ShareCreate, ShareResponse, ShareResponseWithEmail, SharedRecipeItem
from app.modules.recipes.schemas import RecipeResponse
from app.modules.users.models import User

router = APIRouter()
shared_router = APIRouter()


@router.post(
    "/{recipe_id}/shares",
    response_model=ShareResponse,
    summary="Share recipe with user",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Share created"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Recipe or user not found"},
        409: {"description": "Already shared or cannot share with self"},
        422: {"description": "Validation error"},
    },
    tags=["RecipeShares"],
)
def create_share(
    recipe_id: uuid.UUID,
    body: ShareCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return create_share_controller(db, recipe_id=recipe_id, current_user_id=current_user.id, body=body)


@router.get(
    "/{recipe_id}/shares",
    response_model=list[ShareResponseWithEmail],
    summary="List shares for recipe",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["RecipeShares"],
)
def list_shares(
    recipe_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return list_shares_controller(db, recipe_id=recipe_id, current_user_id=current_user.id)


@router.delete(
    "/{recipe_id}/shares/{share_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove share",
    responses={204: {"description": "Removed"}, 401: {"description": "Unauthorized"}, 403: {"description": "Forbidden"}, 404: {"description": "Not found"}},
    tags=["RecipeShares"],
)
def delete_share(
    recipe_id: uuid.UUID,
    share_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    delete_share_controller(db, recipe_id=recipe_id, share_id=share_id, current_user_id=current_user.id)


@shared_router.get(
    "/recipes",
    response_model=PaginatedResponse[SharedRecipeItem],
    summary="List recipes shared with current user",
    responses={200: {"description": "OK"}, 401: {"description": "Unauthorized"}},
    tags=["RecipeShares"],
)
def list_shared_recipes(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items, total = list_shared_recipes_controller(db, current_user.id, limit=limit, offset=offset)
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)
