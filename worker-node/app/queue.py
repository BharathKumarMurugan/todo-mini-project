import json
import os
import sys

import pika
from .logger import logger

QUEUE_HOST = os.getenv("QUEUE_HOST", "localhost")
QUEUE_NAME = os.getenv("QUEUE_NAME", "task_queue")
DQUEUE_NAME = os.getenv("DQUEUE_NAME", "dead_letter_queue")
DQUEUE_EXCHANGE = os.getenv("DQUEUE_EXCHANGE", "dead_letter_exchange")
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 5))

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

        # Declare the dead letter queue
        channel.exchange_declare(exchange=DQUEUE_EXCHANGE, exchange_type='fanout', durable=False)
        channel.queue_declare(queue=DQUEUE_NAME, durable=False)
        channel.queue_bind(exchange=DQUEUE_EXCHANGE, queue=DQUEUE_NAME)
        logger.info(f"Declared Dead Letter Queue: {DQUEUE_NAME} with exchange: {DQUEUE_EXCHANGE}")
        
        # Declare the main queue
        args = {
            "x-dead-letter-exchange": DQUEUE_EXCHANGE,
        }
        channel.queue_declare(queue=QUEUE_NAME, durable=False, arguments=args )
        logger.info(f"Declared Main Queue: {QUEUE_NAME} with dead-lettering arguments")

        def callback(ch, method, properties, body):
            message_body = body.decode()
            delivery_tag = method.delivery_tag

            retry_count = 0
            if properties.headers and 'x-death' in properties.headers:
                for d in properties.headers['x-death']:
                    if d['reason'] == 'rejected' and d['queue'] == QUEUE_NAME:
                        retry_count = d['count']
                        break
            logger.info(f"Received message (Retry: {retry_count}/{MAX_RETRIES}): {message_body}")
            try:
                # process the message here
                if retry_count < MAX_RETRIES:
                    raise ValueError("Simulated processing error")
                data = json.loads(message_body)
                logger.info(f"Processing message: {data}")

                ch.basic_ack(delivery_tag)
                logger.info(f"Message acknowledged (processed successfully): {message_body}")
            except json.JSONDecodeError as err:
                logger.error(f"Failed to decode JSON message: {message_body}. Error {err}", exc_info=True)
                # This is a permanent error for this message, dead-letter it immediately
                ch.basic_nack(delivery_tag, requeue=False) # Do not re-queue
                logger.warning(f"Message dead-lettered (JSON Decode Error): {message_body}")
            except Exception as err:
                logger.error(f"Error processing the message: {err}", exc_info=True)
                if retry_count < MAX_RETRIES:
                    logger.warning(f"Requeuing message for retry (attempt {retry_count + 1}/{MAX_RETRIES}): {message_body}")
                    # Negative ack(Nack) signal with requeue=True to send it back to the original queue
                    # RabbitMQ will add x-death header
                    ch.basic_nack(delivery_tag, requeue=True)
                else:
                    logger.error(f"Max retries ({MAX_RETRIES}) exceeded for message: {message_body}. Sending to DLQ.")
                    # Nack with requeue=False to dead-letter the message
                    ch.basic_nack(delivery_tag, requeue=False)
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