import os  # importing modules
import signal
import threading
import time

from app.logger import logger
from app.worker import create_app, start_consumer_thread
from dotenv import load_dotenv  # load env variables

load_dotenv()

PORT = int(os.getenv("WORKER_NODE_PORT", 3000))

if __name__ == "__main__":
    app = create_app()
    consumer_thread = threading.Thread(target=start_consumer_thread, daemon=True)
    consumer_thread.start()
    logger.info("Consumer thread is started")

    app.run(host="0.0.0.0", port=PORT, debug=app.config['DEBUG'])