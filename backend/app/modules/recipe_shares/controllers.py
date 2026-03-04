"""Recipe share orchestration: permission checks, call services/repos."""
from __future__ import annotations

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.modules.recipe_shares.repositories import (
    create_share,
    delete_share,
    get_share_by_id,
    get_shares_by_recipe_id,
    get_recipes_shared_with_user,
)
from app.modules.recipe_shares.schemas import ShareCreate, ShareResponse, ShareResponseWithEmail, SharedRecipeItem
from app.modules.recipe_shares.services import resolve_shared_with_user_id
from app.modules.recipes.repositories import get_recipe_by_id
from app.modules.recipes.schemas import RecipeResponse


def create_share_controller(
    db: Session,
    recipe_id: uuid.UUID,
    current_user_id: uuid.UUID,
    body: ShareCreate,
) -> ShareResponse:
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise NotFoundError("Recipe not found")
    if recipe.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to share this recipe")
    target_user_id = resolve_shared_with_user_id(
        db, body.shared_with_email, body.shared_with_user_id
    )
    if not target_user_id:
        raise NotFoundError("User not found (invalid email or user id)")
    if target_user_id == current_user_id:
        raise ConflictError("Cannot share with yourself")
    try:
        share = create_share(db, recipe_id=recipe_id, shared_with_user_id=target_user_id, permission=body.permission)
    except IntegrityError:
        raise ConflictError("Recipe already shared with this user")
    from app.modules.notifications.repositories import create_notification
    from app.modules.users.repositories import get_user_by_id
    owner = get_user_by_id(db, current_user_id)
    owner_name = owner.name if owner else "Someone"
    create_notification(
        db,
        target_user_id,
        type="recipe_shared",
        title="Recipe shared with you",
        body=f"{owner_name} shared a recipe with you.",
        link=f"/dashboard/recipes/{recipe_id}",
    )
    return ShareResponse.model_validate(share)


def list_shares_controller(
    db: Session,
    recipe_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> list[ShareResponseWithEmail]:
    from app.modules.users.repositories import get_user_by_id
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise NotFoundError("Recipe not found")
    if recipe.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to list shares for this recipe")
    shares = get_shares_by_recipe_id(db, recipe_id)
    result: list[ShareResponseWithEmail] = []
    for s in shares:
        data = ShareResponse.model_validate(s).model_dump()
        user = get_user_by_id(db, s.shared_with_user_id)
        data["shared_with_email"] = user.email if user else None
        result.append(ShareResponseWithEmail(**data))
    return result


def delete_share_controller(
    db: Session,
    recipe_id: uuid.UUID,
    share_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> None:
    recipe = get_recipe_by_id(db, recipe_id)
    if not recipe:
        raise NotFoundError("Recipe not found")
    if recipe.owner_id != current_user_id:
        raise ForbiddenError("Not allowed to remove shares for this recipe")
    share = get_share_by_id(db, share_id)
    if not share or share.recipe_id != recipe_id:
        raise NotFoundError("Share not found")
    delete_share(db, share)


def list_shared_recipes_controller(
    db: Session,
    current_user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[SharedRecipeItem], int]:
    rows, total = get_recipes_shared_with_user(db, current_user_id, limit=limit, offset=offset)
    return [
        SharedRecipeItem(recipe=RecipeResponse.model_validate(r), permission=perm)
        for r, perm in rows
    ], total
