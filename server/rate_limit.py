"""Small bounded in-process limiter for expensive pilot operations."""

from collections import defaultdict, deque
from threading import Lock
import time

from errors import APIError


class SlidingWindowRateLimiter:
    def __init__(self, limit: int = 30, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._events: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, user_id: str, scope: str) -> None:
        now = time.monotonic()
        key = (user_id, scope)
        with self._lock:
            events = self._events[key]
            while events and events[0] <= now - self.window_seconds:
                events.popleft()
            if len(events) >= self.limit:
                retry_after = max(1, int(self.window_seconds - (now - events[0])))
                raise APIError(
                    status_code=429, code="RATE_LIMITED",
                    message="Too many requests for this operation. Try again shortly.",
                    headers={"Retry-After": str(retry_after)},
                )
            events.append(now)


_expensive_operation_limiter = SlidingWindowRateLimiter()


def get_expensive_operation_limiter() -> SlidingWindowRateLimiter:
    return _expensive_operation_limiter
