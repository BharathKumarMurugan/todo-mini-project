import logging
import os

from pythonjsonlogger import jsonlogger

logger = logging.getLogger("worker-node")

if not logger.handlers:
    handler = logging.StreamHandler()
    log_level_str= os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)
    logger.setLevel(log_level)

    formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(levelname)s %(name)s %(message)s',
        datefmt='%Y-%m-%dT%H:%M:%S%z',
        rename_fields={
            'asctime': 'timestamp',
            'levelname': 'severity',
            'name': 'logger_name',
            'message': 'message'
        }
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

# logger.info("logger initialized")
# logger.warning("This is a warning message")
