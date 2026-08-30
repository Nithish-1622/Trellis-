"""Small Postgres-backed worker process for resource discovery and reevaluation."""

import asyncio
import logging
import os
import socket
import time
import uuid

from config import settings
from database import SessionLocal
from resource_jobs import ResourceDiscoveryService, ResourceJobService
from resource_providers import get_hybrid_resource_provider
from resource_vetting import get_resource_vetting_service


logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


async def run_once(worker_id: str) -> bool:
    db = SessionLocal()
    try:
        jobs = ResourceJobService(db)
        job = jobs.claim_next(worker_id)
        if job is None:
            return False
        processor = ResourceDiscoveryService(db, get_hybrid_resource_provider(), get_resource_vetting_service())
        try:
            if job.job_type == "discovery":
                await processor.run(job)
            elif job.job_type == "evaluation":
                await processor.reevaluate(job)
            elif job.job_type == "interaction_cleanup":
                processor.cleanup_interactions(job)
            else:
                jobs.fail(job, "UNSUPPORTED_JOB_TYPE")
        except Exception as exc:
            logger.error("Resource job %s failed with %s", job.id, type(exc).__name__)
            db.rollback()
            current = db.get(type(job), job.id)
            if current is not None:
                jobs.fail(current, f"JOB_{type(exc).__name__}")
        return True
    finally:
        db.close()


async def run_forever() -> None:
    worker_id = f"{socket.gethostname()}:{os.getpid()}:{uuid.uuid4().hex[:8]}"
    logger.info("Starting Trellis resource worker %s", worker_id)
    next_schedule_at = 0.0
    while True:
        if time.monotonic() >= next_schedule_at:
            db = SessionLocal()
            try:
                ResourceJobService(db).schedule_recurring()
            finally:
                db.close()
            next_schedule_at = time.monotonic() + settings.RESOURCE_SCHEDULER_INTERVAL_SECONDS
        worked = await run_once(worker_id)
        if not worked:
            await asyncio.sleep(settings.RESOURCE_WORKER_POLL_SECONDS)


if __name__ == "__main__":
    asyncio.run(run_forever())
