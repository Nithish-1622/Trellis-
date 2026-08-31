"""Content-free, process-local pilot metrics."""

from collections import defaultdict
from threading import Lock


class PilotMetrics:
    def __init__(self) -> None:
        self._counts: dict[str, int] = defaultdict(int)
        self._latency_ms: dict[str, float] = defaultdict(float)
        self._lock = Lock()

    def observe(self, key: str, elapsed_ms: float, failed: bool = False) -> None:
        with self._lock:
            self._counts[f"{key}.requests"] += 1
            self._latency_ms[key] += elapsed_ms
            if failed:
                self._counts[f"{key}.failures"] += 1

    def increment(self, key: str) -> None:
        with self._lock:
            self._counts[key] += 1

    def snapshot(self) -> dict:
        with self._lock:
            averages = {}
            for key, total in self._latency_ms.items():
                count = self._counts.get(f"{key}.requests", 0)
                averages[f"{key}.average_latency_ms"] = round(total / count, 2) if count else 0
            return {"counters": dict(self._counts), "gauges": averages, "content_recorded": False}


metrics = PilotMetrics()
