from fastapi.testclient import TestClient

from main import app


def test_health_check_reports_service_status():
    response = TestClient(app).get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_legacy_agent_routes_are_removed():
    response = TestClient(app).post("/agent/message", json={"user_id": "other", "message": "hello"})

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
