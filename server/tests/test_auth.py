from dataclasses import dataclass

import httpx
import pytest
from fastapi.testclient import TestClient

from auth import (
    AppwriteAccount,
    AppwriteAuthClient,
    AuthenticatedUser,
    get_appwrite_auth_client,
    require_admin,
)
from errors import APIError
from main import app


@dataclass
class StubAppwriteAuthClient:
    account: AppwriteAccount | None = None
    error: Exception | None = None

    async def validate_jwt(self, token: str) -> AppwriteAccount:
        assert token == "valid-token"
        if self.error:
            raise self.error
        assert self.account is not None
        return self.account


def test_session_rejects_missing_bearer_token():
    response = TestClient(app).get("/v1/auth/session")

    assert response.status_code == 401
    assert response.json() == {
        "error": {
            "code": "AUTHENTICATION_REQUIRED",
            "message": "A valid bearer token is required",
        }
    }


def test_session_derives_identity_and_admin_role_from_validated_jwt():
    stub = StubAppwriteAuthClient(
        account=AppwriteAccount.model_validate(
            {"$id": "admin-user", "email": "admin@example.com", "name": "Admin"}
        )
    )
    app.dependency_overrides[get_appwrite_auth_client] = lambda: stub

    try:
        response = TestClient(app).get(
            "/v1/auth/session",
            headers={"Authorization": "Bearer valid-token"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "user_id": "admin-user",
        "email": "admin@example.com",
        "name": "Admin",
        "roles": ["learner", "admin"],
    }


def test_unknown_routes_use_the_structured_error_envelope():
    response = TestClient(app).get("/not-a-route")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "NOT_FOUND", "message": "Not Found"}
    }


@pytest.mark.asyncio
async def test_appwrite_rejection_is_reported_as_expired_or_invalid_token():
    def reject_token(request: httpx.Request) -> httpx.Response:
        assert request.headers["X-Appwrite-Project"] == "test-project"
        assert request.headers["X-Appwrite-JWT"] == "expired-token"
        return httpx.Response(401, json={"message": "JWT expired"})

    client = AppwriteAuthClient(transport=httpx.MockTransport(reject_token))

    with pytest.raises(APIError) as raised:
        await client.validate_jwt("expired-token")

    assert raised.value.status_code == 401
    assert raised.value.code == "INVALID_AUTHENTICATION_TOKEN"


@pytest.mark.asyncio
async def test_malformed_appwrite_account_response_is_rejected():
    transport = httpx.MockTransport(lambda _request: httpx.Response(200, json={}))
    client = AppwriteAuthClient(transport=transport)

    with pytest.raises(APIError) as raised:
        await client.validate_jwt("valid-token")

    assert raised.value.status_code == 503
    assert raised.value.code == "IDENTITY_PROVIDER_INVALID_RESPONSE"


@pytest.mark.asyncio
async def test_non_admin_user_is_denied_admin_access():
    user = AuthenticatedUser(
        user_id="learner-user",
        email="learner@example.com",
        name="Learner",
        roles=["learner"],
    )

    with pytest.raises(APIError) as raised:
        await require_admin(user)

    assert raised.value.status_code == 403
    assert raised.value.code == "ADMIN_REQUIRED"
