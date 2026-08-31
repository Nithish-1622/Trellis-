import socket

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from catalog_api import PublicLinkChecker
from errors import APIError
from errors import register_error_handlers
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


@pytest.mark.asyncio
async def test_link_checker_blocks_hostnames_resolving_to_private_networks(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *_args, **_kwargs: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 443))])

    assert await PublicLinkChecker().check("https://internal.example/resource") == "blocked"


def test_unexpected_errors_keep_the_structured_envelope_and_hide_details():
    isolated = FastAPI()
    register_error_handlers(isolated)

    @isolated.get("/failure")
    def failure():
        raise RuntimeError("database password should never be exposed")

    response = TestClient(isolated, raise_server_exceptions=False).get("/failure")
    assert response.status_code == 500
    assert response.json() == {"error": {"code": "INTERNAL_ERROR", "message": "An unexpected server error occurred"}}
