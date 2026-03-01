"""Shared utilities."""
from __future__ import annotations

import uuid


def is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except (ValueError, TypeError):
        return False
