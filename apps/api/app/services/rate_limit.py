import asyncio
from collections import defaultdict, deque
from time import monotonic


class RateLimitExceededError(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        self.retry_after_seconds = max(1, retry_after_seconds)
        super().__init__("Request limit exceeded")


class SlidingWindowRateLimiter:
    """Small per-process limiter that protects paid provider endpoints."""

    def __init__(self) -> None:
        self._events: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(
        self,
        subject: str,
        scope: str,
        maximum_requests: int,
        window_seconds: int = 60,
    ) -> None:
        now = monotonic()
        cutoff = now - window_seconds
        key = (subject, scope)

        async with self._lock:
            events = self._events[key]
            while events and events[0] <= cutoff:
                events.popleft()

            if len(events) >= maximum_requests:
                retry_after = int(window_seconds - (now - events[0])) + 1
                raise RateLimitExceededError(retry_after)

            events.append(now)
