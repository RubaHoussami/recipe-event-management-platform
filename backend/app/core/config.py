"""Application settings via pydantic-settings (env vars)."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Load from environment; .env file supported."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/app"

    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7  # 7 days

    # CORS (comma-separated string in env, parsed to list)
    cors_origins: str | List[str] = "http://localhost:5173,http://localhost:3000"

    # Encrypt user-stored OpenAI keys at rest (Fernet key: 32 bytes base64url)
    encryption_key: str = ""

    # Email (OTP verification). If not set, OTP is logged but not sent.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@feastandfest.local"
    otp_expire_minutes: int = 15
    otp_resend_cooldown_seconds: int = 60

    # Hugging Face inference (hosted model). OpenAI-compatible API at router.huggingface.co.
    # If set, verified users can choose "Use hosted model" in settings.
    hf_api_key: str = ""
    hf_base_url: str = "https://router.huggingface.co/v1"
    hf_model: str = ""

    # AI rate limit: max requests per user per window (for hosted/model calls).
    ai_rate_limit_per_minute: int = 30

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, list):
            return v
        return [origin.strip() for origin in str(v).split(",") if origin.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
