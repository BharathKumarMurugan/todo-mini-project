import json
import os
import sys
import pika
import time
import pika.exceptions
from bson.objectid import ObjectId
from pymongo.errors import PyMongoError
from .db import close_mongo_connection, get_mongo_connection
from .logger import logger

QUEUE_HOST = os.getenv("QUEUE_HOST", "rabbitmq")
QUEUE_NAME = os.getenv("QUEUE_NAME", "taskqueue")
DQUEUE_NAME = os.getenv("DQUEUE_NAME", "dead_letter_queue")
DQUEUE_EXCHANGE = os.getenv("DQUEUE_EXCHANGE", "dead_letter_exchange")
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 5))

# Connection retry parameters
RABBITMQ_RETRY_ATTEMPTS = int(os.getenv("RABBITMQ_RETRY_ATTEMPTS", 10))
RABBITMQ_RETRY_DELAY_SECONDS = int(os.getenv("RABBITMQ_RETRY_DELAY_SECONDS", 5))

def main():
    """
    Main function to connect to RabbitMQ and MongoDB, and handle messages.
    """
    if not QUEUE_HOST:
        logger.error("Queue host is not set. Please set the QUEUE_HOST environment variable. Exiting...")
        sys.exit(1)
    if not QUEUE_NAME:
        logger.error("Queue name is not set. Please set the QUEUE_NAME environment variable. Exiting...")
        sys.exit(1)

    # Connect to MongoDB
    mongoConn = get_mongo_connection()
    if mongoConn is None:
        logger.error("Failed to connect to MongoDB. Exiting...")
        sys.exit(1)

    logger.info(f"Attempt to connect to Rabbitmq")
    connection = None
    channel = None

    # Retry logic for rabbitmq connection
    for attempt in range(RABBITMQ_RETRY_ATTEMPTS):
        logger.info(f"Attempting to connect to RabbitMQ at {QUEUE_HOST} (Attempt {attempt + 1}/{RABBITMQ_RETRY_ATTEMPTS})")
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=QUEUE_HOST))
            channel = connection.channel()
            logger.info("Connected to RabbitMQ")
            break
        except pika.exceptions.AMQPConnectionError as err:
            logger.warning(f"RabbitMQ connection failed: {err}. Retrying in {RABBITMQ_RETRY_DELAY_SECONDS} seconds...")
            time.sleep(RABBITMQ_RETRY_DELAY_SECONDS)
        except Exception as err:
            logger.error(f"An unexpected error occurred during RabbitMQ connection attempt: {err}", exc_info=True)
            sys.exit(1)
    else:
        logger.error(f"Failed to connect to RabbitMQ after {RABBITMQ_RETRY_ATTEMPTS} attempts. Exiting...")
        sys.exit(1)

            
    try:
        # Declare the dead letter queue
        channel.exchange_declare(exchange=DQUEUE_EXCHANGE, exchange_type='fanout', durable=True)
        channel.queue_declare(queue=DQUEUE_NAME, durable=True)
        channel.queue_bind(exchange=DQUEUE_EXCHANGE, queue=DQUEUE_NAME)
        logger.info(f"Declared Dead Letter Queue: {DQUEUE_NAME} with exchange: {DQUEUE_EXCHANGE}")
        
        # Declare the main queue
        args = {
            "dead-letter-exchange": DQUEUE_EXCHANGE,
        }
        channel.queue_declare(queue=QUEUE_NAME, durable=True, arguments=args )
        logger.info(f"Declared Main Queue: {QUEUE_NAME} with dead-lettering arguments")

        def callback(ch, method, properties, body):
            """
            Callback function to process messages from the queue.
            Handles message decoding, processing, retry logic, store data in mongodb and dead-lettering
            """
            message_body = body.decode()
            delivery_tag = method.delivery_tag

            retry_count = 0
            if properties.headers and 'x-death' in properties.headers:
                # extract retry count from x-death header
                for d in properties.headers['x-death']:
                    if d['reason'] == 'rejected' and d['queue'] == QUEUE_NAME:
                        retry_count = d['count']
                        break
            logger.info(f"Received message (Retry: {retry_count}/{MAX_RETRIES}): {message_body}")
            try:
                # process the message here

                # # simulate a processing error for testing purposes
                # if retry_count < MAX_RETRIES:
                #     raise ValueError("Simulated processing error")
                
                data = json.loads(message_body)
                logger.info(f"Processing message: {data}")

                # Store the data in MongoDB
                taskAction = data.get("action")

                if not taskAction:
                    logger.error(f"Queue message does not contain 'action' field: {data}")
                    ch.basic_nack(delivery_tag, requeue=False) # do not requeue
                    logger.warning(f"Message dead-lettered (missing 'action' field): {message_body}")
                    return

                if taskAction not in ["create", "update", "delete"]:
                    logger.error(f"Queue message contain invalid 'action' field: {data}")
                    ch.basic_nack(delivery_tag, requeue=False) # do not requeue
                    logger.warning(f"Message dead-lettered (invalid 'action' field): {message_body}")
                    return

                if taskAction == "create":
                    if '_id' in data:
                        del data['_id'] # remove _id field if it exists, as MongoDB will generate a new one
                    try:
                        result = mongoConn.insert_one(data)
                        logger.info(f"Data is stored in MongoDB with ID: {result.inserted_id}")
                    except Exception as err:
                        logger.error(f"Failed to store data in MongoDB: {err}", exc_info=True)
                        # re-raise the error to trigger retry logic
                        raise err

                # Handle update action
                if taskAction == "update":
                    documentId = data.get('_id')
                    if not documentId:
                        logger.error(f"Queue message does not contain '_id' field for update action: {data}")
                        ch.basic_nack(delivery_tag, requeue=False) # do not requeue
                        logger.warning(f"Message dead-lettered (does not contian '_id' field): {message_body}")
                        return

                    update_payload = {}
                    for key, value in data.items():
                        if key not in ['_id', 'action']:
                            update_payload[key] = value
                    if not update_payload:
                        logger.warning(f"Update message for ID {documentId} has no fields to update. Acknowledging: {message_body}")
                        ch.basic_ack(delivery_tag)
                        return
                    try:
                        object_id = ObjectId(documentId)
                    except Exception as err:
                        logger.error(f"Invalid '_id' format for update: {documentId}. Error: {err}. Dead-lettering: {message_body}")
                        ch.basic_nack(delivery_tag, requeue=False)
                        return
                    try:
                        result = mongoConn.update_one({"_id": object_id}, {"$set": update_payload})
                        if result.matched_count > 0:
                            logger.info(f"Successfully updated data with ID: {documentId}. Modified count: {result.modified_count}")
                        else:
                            logger.warning(f"No document found with ID: {documentId}")
                    except Exception as err:
                        logger.error(f"Failed to update data in MongoDB: {err}", exc_info=True)
                        # re-raise the error to trigger retry logic
                        raise err

                # Handle delete action
                if taskAction == "delete":
                    documentId = data.get('_id')
                    if not documentId:
                        logger.error(f"Queue message does not contain '_id' field for update action: {data}")
                        ch.basic_nack(delivery_tag, requeue=False) # do not requeue
                        logger.warning(f"Message dead-lettered (does not contian '_id' field): {message_body}")
                        return
                    try:
                        object_id = ObjectId(documentId)
                    except Exception as err:
                        logger.error(f"Invalid '_id' format for update: {documentId}. Error: {err}. Dead-lettering: {message_body}")
                        ch.basic_nack(delivery_tag, requeue=False)
                        return
                    try:
                        result = mongoConn.delete_one({"_id": object_id})
                        if result.deleted_count > 0:
                            logger.info(f"Successfully deleted data with ID: {documentId}.")
                        else:
                            logger.warning(f"No document found with ID: {documentId}")
                    except Exception as err:
                        logger.error(f"Failed to delete data in MongoDB: {err}", exc_info=True)
                        # re-raise the error to trigger retry logic
                        raise err


                # ack the message if processed and stored in Mongodb is successful
                ch.basic_ack(delivery_tag)
                logger.info(f"Message acknowledged (processed successfully): {message_body}")
            except json.JSONDecodeError as err:
                logger.error(f"Failed to decode JSON message: {message_body}. Error {err}", exc_info=True)
                # This is a permanent error for this message, dead-letter it immediately
                ch.basic_nack(delivery_tag, requeue=False) # Do not re-queue
                logger.warning(f"Message dead-lettered (JSON Decode Error): {message_body}")
            except PyMongoError as err:
                logger.error(f"MongoDB operation failed for message: {message_body}. Error: {err}", exc_info=True)
                # If a MongoDB error occurs, treat it like other processing errors for retries
                if retry_count < MAX_RETRIES:
                    logger.warning(f"Requeuing message for retry (attempt {retry_count + 1}/{MAX_RETRIES}): {message_body}")
                    ch.basic_nack(delivery_tag, requeue=True)
                else:
                    logger.error(f"Max retries ({MAX_RETRIES}) exceeded for message: {message_body}. Sending to DLQ.")
                    ch.basic_nack(delivery_tag, requeue=False)
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

        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback, auto_ack=False)

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
        close_mongo_connection()

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
            os._exit(0) # force exit if sys.exit fails