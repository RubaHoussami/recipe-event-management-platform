"""Auth routes: register, login (public), me (protected)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.controllers import (
    clear_avatar_controller,
    login_controller_auth,
    me_controller_auth,
    register_controller_auth,
    resend_otp_controller,
    set_ai_preference_controller,
    set_openai_key_controller,
    update_me_controller_auth,
    upload_avatar_controller,
    verify_email_controller,
)
from app.modules.auth.schemas import (
    LoginRequest,
    MeUpdateRequest,
    RegisterRequest,
    ResendOtpRequest,
    SetAiPreferenceRequest,
    SetOpenAIKeyRequest,
    TokenResponse,
    UserMeResponse,
    VerifyEmailRequest,
)
from app.modules.users.models import User
from app.modules.users.repositories import get_user_by_id

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
    return {"id": str(user.id), "email": user.email, "name": user.name, "role": user.role, "message": "Check your email for a verification code."}


@router.post(
    "/verify-email",
    response_model=TokenResponse,
    summary="Verify email with OTP",
    description="Submit the 6-digit code sent to your email. Returns access token on success.",
    responses={
        200: {"description": "Verified and logged in"},
        403: {"description": "Invalid or expired code"},
        404: {"description": "User not found"},
    },
    tags=["Auth"],
)
def verify_email(
    body: VerifyEmailRequest,
    db: Annotated[Session, Depends(get_db)],
):
    return verify_email_controller(db, email=body.email, code=body.code)


@router.post(
    "/resend-otp",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Resend verification code",
    description="Sends a new OTP to the given email. Rate-limited (e.g. 60s cooldown).",
    responses={
        204: {"description": "Code sent"},
        400: {"description": "Email already verified"},
        404: {"description": "User not found"},
        429: {"description": "Wait before requesting again"},
    },
    tags=["Auth"],
)
def resend_otp(
    body: ResendOtpRequest,
    db: Annotated[Session, Depends(get_db)],
):
    resend_otp_controller(db, email=body.email)


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
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Update current user profile",
    description="Update display name. Avatar is set via POST /auth/me/avatar.",
    responses={
        204: {"description": "Updated"},
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"},
    },
    tags=["Auth"],
)
def update_me(
    body: MeUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    update_me_controller_auth(db, str(current_user.id), name=body.name)


@router.get(
    "/me/avatar",
    summary="Get current user avatar image",
    description="Returns the uploaded avatar image. 404 if none.",
    responses={
        200: {"content": {"image/*": {}}, "description": "Avatar image"},
        404: {"description": "No avatar set"},
    },
    tags=["Auth"],
)
def get_me_avatar(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    user = get_user_by_id(db, current_user.id)
    if not user or not user.avatar_image:
        return Response(status_code=status.HTTP_404_NOT_FOUND)
    return Response(
        content=user.avatar_image,
        media_type=user.avatar_content_type or "image/jpeg",
    )


@router.post(
    "/me/avatar",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Upload avatar image",
    description="Upload a profile picture (JPEG, PNG, or WebP, max 2MB).",
    responses={
        204: {"description": "Uploaded"},
        400: {"description": "Invalid type or too large"},
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"},
    },
    tags=["Auth"],
)
def upload_me_avatar(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile, File(description="Image file (JPEG, PNG, WebP)")],
):
    content_type = file.content_type or "application/octet-stream"
    if not content_type.startswith("image/"):
        content_type = "application/octet-stream"
    body = file.file.read()
    upload_avatar_controller(db, str(current_user.id), body, content_type)


@router.delete(
    "/me/avatar",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove avatar",
    description="Delete the uploaded profile picture.",
    responses={204: {"description": "Removed"}, 401: {"description": "Unauthorized"}},
    tags=["Auth"],
)
def delete_me_avatar(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    clear_avatar_controller(db, str(current_user.id))


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


@router.patch(
    "/me/ai-preference",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Set AI preference",
    description="Set how AI is used: off, my_key (your OpenAI key), or hosted (app’s Azure model).",
    responses={
        204: {"description": "Preference updated"},
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"},
    },
    tags=["Auth"],
)
def set_ai_preference(
    body: SetAiPreferenceRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    set_ai_preference_controller(db, str(current_user.id), body.ai_preference)
