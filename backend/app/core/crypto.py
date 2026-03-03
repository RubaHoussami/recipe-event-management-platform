"""Encrypt/decrypt sensitive values (e.g. user OpenAI key). Uses Fernet; key from settings."""
from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import get_settings


def _get_fernet() -> Fernet:
    settings = get_settings()
    key = (settings.encryption_key or "").strip().encode("utf-8")
    if not key:
        key = hashlib.sha256(get_settings().jwt_secret.encode()).digest()
    # Fernet needs 32 bytes base64url
    key_b64 = base64.urlsafe_b64encode(key[:32].ljust(32, b"0")[:32])
    return Fernet(key_b64)


def encrypt_openai_key(plain: str) -> str:
    """Encrypt a plain OpenAI API key for storage. Never log or return plain."""
    if not plain or not plain.strip():
        return ""
    return _get_fernet().encrypt(plain.strip().encode("utf-8")).decode("ascii")


def decrypt_openai_key(cipher: str) -> str:
    """Decrypt stored value to plain API key. Use only in memory for API call."""
    if not cipher or not cipher.strip():
        return ""
    try:
        return _get_fernet().decrypt(cipher.strip().encode("ascii")).decode("utf-8")
    except Exception:
        return ""
