"""User routes: avatar for any user (for friends list etc.). Auth uses /auth/me."""
from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.repositories import get_user_by_id

router = APIRouter()


@router.get(
    "/{user_id}/avatar",
    summary="Get user avatar image",
    description="Returns the user's uploaded avatar. 404 if none. Requires auth.",
    responses={
        200: {"content": {"image/*": {}}, "description": "Avatar image"},
        404: {"description": "User or avatar not found"},
    },
)
def get_user_avatar(
    user_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    user = get_user_by_id(db, user_id)
    if not user or not user.avatar_image:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    return Response(
        content=user.avatar_image,
        media_type=user.avatar_content_type or "image/jpeg",
    )
