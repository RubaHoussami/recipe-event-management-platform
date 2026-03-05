"""Auth request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=10, description="6-digit OTP from email")


class ResendOtpRequest(BaseModel):
    email: EmailStr


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
    has_avatar: bool = Field(False, description="True if user has an uploaded avatar (fetch from GET /auth/me/avatar)")
    email_verified: bool = Field(False, description="True if user has verified their email with OTP")
    ai_preference: str = Field("my_key", description="AI source: off, my_key, or hosted")
    azure_ai_available: bool = Field(False, description="True if app has a hosted AI model configured (e.g. Hugging Face)")


class MeUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)


class SetOpenAIKeyRequest(BaseModel):
    openai_api_key: str | None = Field(None, description="Key to store (encrypted); send null to clear")


class SetAiPreferenceRequest(BaseModel):
    ai_preference: str = Field(..., description="off, my_key, or hosted")

    @field_validator("ai_preference")
    @classmethod
    def ai_preference_value(cls, v: str) -> str:
        if v not in ("off", "my_key", "hosted"):
            raise ValueError("ai_preference must be off, my_key, or hosted")
        return v
