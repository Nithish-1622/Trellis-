from fastapi.testclient import TestClient

from main import app
from config import settings


def test_health_check_reports_service_status():
    response = TestClient(app).get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_legacy_agent_routes_are_removed():
    response = TestClient(app).post("/agent/message", json={"user_id": "other", "message": "hello"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_pilot_flag_hides_versioned_product_routes():
    original = settings.PILOT_FEATURE_ENABLED
    settings.PILOT_FEATURE_ENABLED = False
    try:
        response = TestClient(app).get("/v1/me/dashboard")
    finally:
        settings.PILOT_FEATURE_ENABLED = original

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PILOT_DISABLED"
