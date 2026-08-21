import asyncio

import pytest

from app.services.rate_limit import RateLimitExceededError, SlidingWindowRateLimiter


def test_sliding_window_limiter_separates_users_and_scopes() -> None:
    async def scenario() -> None:
        limiter = SlidingWindowRateLimiter()
        await limiter.check("user-a", "places", 1)
        await limiter.check("user-b", "places", 1)
        await limiter.check("user-a", "routes", 1)

        with pytest.raises(RateLimitExceededError) as exc_info:
            await limiter.check("user-a", "places", 1)

        assert exc_info.value.retry_after_seconds >= 1

    asyncio.run(scenario())
