"""Auth request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    openai_configured: bool = Field(False, description="True if user has stored an OpenAI key (key never returned)")


class SetOpenAIKeyRequest(BaseModel):
    openai_api_key: str | None = Field(None, description="Key to store (encrypted); send null to clear")
