import json
import os
import sys

import pika
from .logger import logger

QUEUE_HOST = os.getenv("QUEUE_HOST", "localhost")
QUEUE_NAME = os.getenv("QUEUE_NAME", "task_queue")

def main():
    if not QUEUE_HOST:
        logger.error("Queue host is not set. Please set the QUEUE_HOST environment variable. Exiting...")
        sys.exit(1)
    if not QUEUE_NAME:
        logger.error("Queue name is not set. Please set the QUEUE_NAME environment variable. Exiting...")
        sys.exit(1)

    logger.info(f"Attempt to connect to Rabbitmq")
    connection = None
    channel = None
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=QUEUE_HOST))
        channel = connection.channel()
        
        logger.info("Connected to RabbitMQ")
        
        channel.queue_declare(queue=QUEUE_NAME, durable=False)
        
        def callback(ch, method, properties, body):
            message_body = body.decode()
            logger.info(f"Received message: {message_body}")
            try:
                # process the message here
                data = json.loads(message_body)
                logger.info(f"Processing message: {data}")
            except json.JSONDecodeError as err:
                logger.error(f"Failed to decode JSON message: {err}", exc_info=True)
            except Exception as err:
                logger.error(f"Error processing the message: {err}", exc_info==True)
            finally:
                pass

        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback, auto_ack=True)

        logger.info("Waiting for messages...")
        channel.start_consuming()
    except pika.exceptions.AMQPConnectionError as err:
        logger.error("Failed to connect to RabbitMQ", exc_info=err)
        sys.exit(1)
    except Exception as err:
        logger.error("An unexpected Error occured", exc_info=err)
        sys.exit(1)
    finally:
        if connection and not connection.is_closed:
            connection.close()
            logger.info("Queue connection closed")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    try:
        main()
    except KeyboardInterrupt:
        logger.error("Interrupted by user, shutting down...")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)