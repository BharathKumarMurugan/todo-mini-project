import os
import threading
import time

from dotenv import load_dotenv
from flask import Flask

from .health import health_bp
from .logger import logger
from .queue import main as start_queue_consumer

load_dotenv()

PORT = int(os.getenv("WORKER_NODE_PORT", 3000))

def create_app():
    app = Flask(__name__)

    app.config['DEBUG'] = os.getenv('WORKER_NODE_ENV') == 'development'

    app.register_blueprint(health_bp)

    logger.info("Worker node app initialized")

    return app

def start_consumer_thread():
    """
    Start the queue consumer in a separate thread.
    """
    time.sleep(1) # To ensure the app is ready before starting the consumer
    logger.info("Starting queue consumer thread...")
    try:
        start_queue_consumer()
    except Exception as err:
        logger.error("Error in queue consumer thread", exc_info=err)

if __name__ == "__main__":
    app = create_app()

    consumer_thread = threading.Thread(target=start_consumer_thread, daemon=True)
    consumer_thread.start()
    logger.info("Consumer thread is started")
    app.run(host="0.0.0.0", port=PORT)