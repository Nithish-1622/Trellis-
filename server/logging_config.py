"""Application logging defaults that keep third-party credentials out of logs."""

import logging


def configure_logging(level: str) -> None:
    logging.basicConfig(level=level, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    # httpx logs complete URLs at INFO, including query-string credentials used
    # by APIs such as YouTube. Application services log sanitized outcomes.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
