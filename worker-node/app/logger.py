import logging
import os
from pythonjsonlogger import jsonlogger

logger = logging.getLogger("worker-node")

if not logger.handlers:
    log_file = "worker-node.log"
    log_dir = "/app/logs"

    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, log_file)

    handler = logging.FileHandler(log_path)
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

    if os.getenv("LOG_TO_CONSOLE", "true").lower() == "true":
        console_handler = logging.StreamHandler()
        console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(name)s - %(message)s')
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

logger.info(f"Worker-node logger initialized. Logging to {log_path}")
# logger.info("logger initialized")
# logger.warning("This is a warning message")
