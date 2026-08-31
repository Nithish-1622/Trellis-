"""Appwrite JWT validation and authorization dependencies."""

from typing import Annotated, Protocol

import httpx
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from config import settings
from errors import APIError


class AppwriteAccount(BaseModel):
    """Validated subset of the Appwrite account response."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    user_id: str = Field(alias="$id", min_length=1)
    email: str = ""
    name: str = ""
    status: bool = True


class AuthenticatedUser(BaseModel):
    """Identity available to application handlers after JWT validation."""

    user_id: str
    email: str
    name: str
    roles: list[str]


class AuthClient(Protocol):
    async def validate_jwt(self, token: str) -> AppwriteAccount: ...


class AppwriteAuthClient:
    """Validate user JWTs against Appwrite's Account API."""

    def __init__(self, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._transport = transport

    async def validate_jwt(self, token: str) -> AppwriteAccount:
        if not settings.APPWRITE_ENDPOINT or not settings.APPWRITE_PROJECT_ID:
            raise APIError(
                status_code=503,
                code="IDENTITY_PROVIDER_UNAVAILABLE",
                message="Identity provider is not configured",
            )

        url = f"{settings.APPWRITE_ENDPOINT.rstrip('/')}/account"
        headers = {
            "X-Appwrite-Project": settings.APPWRITE_PROJECT_ID,
            "X-Appwrite-JWT": token,
        }

        try:
            async with httpx.AsyncClient(
                timeout=settings.APPWRITE_AUTH_TIMEOUT_SECONDS,
                transport=self._transport,
            ) as client:
                response = await client.get(url, headers=headers)
        except httpx.TimeoutException as exc:
            raise APIError(
                status_code=503,
                code="IDENTITY_PROVIDER_UNAVAILABLE",
                message="Identity provider did not respond in time",
            ) from exc
        except httpx.HTTPError as exc:
            raise APIError(
                status_code=503,
                code="IDENTITY_PROVIDER_UNAVAILABLE",
                message="Identity provider is unavailable",
            ) from exc

        if response.status_code in {401, 403}:
            raise APIError(
                status_code=401,
                code="INVALID_AUTHENTICATION_TOKEN",
                message="The bearer token is invalid or expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not response.is_success:
            raise APIError(
                status_code=503,
                code="IDENTITY_PROVIDER_UNAVAILABLE",
                message="Identity provider could not validate the token",
            )

        try:
            account = AppwriteAccount.model_validate(response.json())
        except (ValueError, ValidationError) as exc:
            raise APIError(
                status_code=503,
                code="IDENTITY_PROVIDER_INVALID_RESPONSE",
                message="Identity provider returned an invalid response",
            ) from exc

        if not account.status:
            raise APIError(
                status_code=401,
                code="ACCOUNT_DISABLED",
                message="The authenticated account is disabled",
            )
        return account


bearer_scheme = HTTPBearer(auto_error=False, bearerFormat="JWT")


def get_appwrite_auth_client() -> AuthClient:
    return AppwriteAuthClient()


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    client: Annotated[AuthClient, Depends(get_appwrite_auth_client)],
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise APIError(
            status_code=401,
            code="AUTHENTICATION_REQUIRED",
            message="A valid bearer token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    account = await client.validate_jwt(credentials.credentials)
    roles = ["learner"]
    if account.user_id in settings.admin_user_ids:
        roles.append("admin")

    return AuthenticatedUser(
        user_id=account.user_id,
        email=account.email,
        name=account.name,
        roles=roles,
    )


async def require_admin(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> AuthenticatedUser:
    if "admin" not in user.roles:
        raise APIError(
            status_code=403,
            code="ADMIN_REQUIRED",
            message="Administrator access is required",
        )
    return user
