"""Auth routes: register, login (public), me (protected)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user, get_current_user_id
from app.modules.auth.controllers import (
    login_controller_auth,
    me_controller_auth,
    register_controller_auth,
    set_openai_key_controller,
)
from app.modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    SetOpenAIKeyRequest,
    TokenResponse,
    UserMeResponse,
)
from app.modules.users.models import User

router = APIRouter()


@router.post(
    "/register",
    response_model=dict,
    summary="Register a new user",
    description="Public. Creates a user and returns user data.",
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "User created"},
        409: {"description": "Email already registered"},
        422: {"description": "Validation error"},
    },
    tags=["Auth"],
)
def register(
    body: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
):
    user = register_controller_auth(db, email=body.email, name=body.name, password=body.password)
    return {"id": str(user.id), "email": user.email, "name": user.name, "role": user.role}


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Public. Returns JWT access token.",
    responses={
        200: {"description": "Success"},
        403: {"description": "Invalid email or password"},
        422: {"description": "Validation error"},
    },
    tags=["Auth"],
)
def login(
    body: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    return login_controller_auth(db, email=body.email, password=body.password)


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get current user",
    description="Protected. Returns authenticated user.",
    responses={
        200: {"description": "Success"},
        401: {"description": "Not authenticated or invalid token"},
        403: {"description": "Forbidden"},
    },
    tags=["Auth"],
)
def me(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    return me_controller_auth(db, user_id=str(current_user.id))


@router.patch(
    "/me/ai-key",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Set or clear OpenAI API key",
    description="Store your key (encrypted) to enable AI features, or send null to clear. Key is never returned in any response.",
    responses={
        204: {"description": "Key updated"},
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"},
    },
    tags=["Auth"],
)
def set_ai_key(
    body: SetOpenAIKeyRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    set_openai_key_controller(db, str(current_user.id), body.openai_api_key)
