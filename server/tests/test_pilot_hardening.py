import time

import pytest

from errors import APIError
from rate_limit import SlidingWindowRateLimiter
from telemetry import PilotMetrics


def test_expensive_operation_limiter_is_scoped_and_returns_retry_metadata():
    limiter = SlidingWindowRateLimiter(limit=2, window_seconds=60)
    limiter.check("learner-one", "chat")
    limiter.check("learner-one", "chat")
    limiter.check("learner-one", "provider")
    limiter.check("learner-two", "chat")

    with pytest.raises(APIError) as caught:
        limiter.check("learner-one", "chat")
    assert caught.value.status_code == 429
    assert caught.value.headers and "Retry-After" in caught.value.headers


def test_metrics_record_only_aggregates_and_latency():
    metrics = PilotMetrics()
    metrics.observe("http.GET./v1/me/dashboard", 12.5)
    metrics.observe("http.GET./v1/me/dashboard", 7.5, failed=True)
    snapshot = metrics.snapshot()

    assert snapshot["counters"]["http.GET./v1/me/dashboard.requests"] == 2
    assert snapshot["gauges"]["http.GET./v1/me/dashboard.average_latency_ms"] == 10
    assert snapshot["content_recorded"] is False
