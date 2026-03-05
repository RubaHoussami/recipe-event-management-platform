"""In-memory per-user rate limiter for AI endpoints. Thread-safe; resets each minute."""
from __future__ import annotations

import threading
import time
from collections import defaultdict


class AIRateLimiter:
    """Tracks request counts per user per minute. Call check() before processing; raises if over limit."""

    def __init__(self, max_per_minute: int = 30) -> None:
        self._max = max_per_minute
        self._counts: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, user_id: str) -> None:
        """Increment and check. Raises PermissionError if over limit (caller should map to 429)."""
        now = time.monotonic()
        window_start = now - 60.0  # 1 minute
        with self._lock:
            times = self._counts[user_id]
            # Drop timestamps outside the window
            while times and times[0] < window_start:
                times.pop(0)
            if len(times) >= self._max:
                raise PermissionError("AI rate limit exceeded. Try again in a minute.")
            times.append(now)


_ai_limiter: AIRateLimiter | None = None


def get_ai_rate_limiter() -> AIRateLimiter:
    global _ai_limiter
    if _ai_limiter is None:
        from app.core.config import get_settings
        _ai_limiter = AIRateLimiter(max_per_minute=get_settings().ai_rate_limit_per_minute)
    return _ai_limiter
