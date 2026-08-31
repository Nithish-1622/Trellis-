# Trellis API

FastAPI service for Trellis personalized learning. Run it through the repository-root Docker Compose and Makefile workflows described in the [root README](../README.md).

The service validates Appwrite user JWTs, derives ownership server-side, stores learning data in PostgreSQL, and migrates schema with Alembic. OpenAPI is available at `/docs`; readiness is available at `/health/ready`.

Development tests:

```bash
docker compose -f ../compose.yaml -f ../compose.dev.yaml run --rm -e PYTHONPATH=/app api python -m pytest -q
```

Never place Appwrite, provider, or LLM secrets in tracked files. Start from `.env.example`.
