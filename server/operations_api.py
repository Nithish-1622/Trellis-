"""Administrator-only operational visibility."""

from typing import Annotated

from fastapi import APIRouter, Depends

from auth import AuthenticatedUser, require_admin
from telemetry import metrics


router = APIRouter(prefix="/v1/admin/operations", tags=["operations"])


@router.get("/metrics")
def pilot_metrics(_admin: Annotated[AuthenticatedUser, Depends(require_admin)]) -> dict:
    return metrics.snapshot()
