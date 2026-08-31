import logging

from logging_config import configure_logging


def test_dependency_http_logs_cannot_emit_credential_bearing_urls():
    original_levels = {name: logging.getLogger(name).level for name in ("httpx", "httpcore")}
    try:
        configure_logging("INFO")

        assert logging.getLogger("httpx").level >= logging.WARNING
        assert logging.getLogger("httpcore").level >= logging.WARNING
    finally:
        for name, level in original_levels.items():
            logging.getLogger(name).setLevel(level)
