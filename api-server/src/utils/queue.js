import amqplib from "amqplib";
import logger from "./logger.js";

const QUEUE_NAME = process.env.QUEUE_NAME || "taskqueue";
const QUEUE_URL = process.env.QUEUE_URL || "amqp://rabbitmq";
const DQUEUE_EXCHANGE = process.env.DQUEUE_EXCHANGE || "dead_letter_exchange";

let channel;
let connection;

const QUEUE_ASSERT_RETRY_ATTEMPTS = parseInt("5", 10);
const QUEUE_ASSERT_RETRY_DELAY_MS = parseInt("5", 10);

/**
 * Connects to RabbitMQ server and sets up the channel
 */
export async function connectToRabbitMQ() {
  try {
    connection = await amqplib.connect(QUEUE_URL);
    // const conn = await amqplib.connect("amqp://localhost");
    channel = await connection.createChannel();
    logger.info("Connected to RabbitMQ server");
    connection.on("error", (err) => {
      logger.error("RabbitMQ connection error:", err);
      // Attempt to reconnect or handle the error appropriately
      // For simplicity, we'll just exit here, but in production you might retry
      process.exit(1);
    });
    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed.");
    });
    channel.on("error", (err) => {
      logger.error("RabbitMQ channel error:", err);
    });
    channel.on("close", () => {
      logger.warn("RabbitMQ channel closed.");
    });
  } catch (err) {
    logger.error("Failed to connect to Queue server: ", err);
    process.exit(1);
  }
}

export async function publishToQueue(message) {
  try {
    if (!channel) {
      // Attempt to reconnect if channel is not initialized (e.g., after a previous failure)
      logger.warn("RabbitMQ channel not initialized. Attempting to reconnect...");
      await connectToRabbitMQ();
      if (!channel) {
        logger.error("Failed to re-initialize RabbitMQ channel. Message will not be sent.");
        return;
      }
    }
    // --- ADDED NEW DEBUG LOG HERE ---
    logger.info(`DQUEUE_EXCHANGE env var: '${DQUEUE_EXCHANGE}'`);
    // --- END NEW DEBUG LOG ---
    const queueArgs = {
      durable: true,
      "dead-letter-exchange": DQUEUE_EXCHANGE || "dead_letter_exchange",
      // updated `x-dead-letter-exchange` to `dead-letter-exchange`.
    };
    let assertSuccess = false;
    for (let i = 0; i < QUEUE_ASSERT_RETRY_ATTEMPTS; i++) {
      // --- EXISTING DEBUG LOG HERE ---
      logger.info(`Asserting queue '${QUEUE_NAME}' with arguments: ${JSON.stringify(queueArgs)}`);
      // --- END EXISTING DEBUG LOG ---
      try {
        await channel.assertQueue(QUEUE_NAME, queueArgs);
        logger.info(`Successfully asserted queue '${QUEUE_NAME}'`);
        assertSuccess = true;
        break;
      } catch (err) {
        logger.error(`Failed to assert Queue '${QUEUE_NAME}': ${err.message}. Retrying in ${QUEUE_ASSERT_RETRY_DELAY_MS} ms...`, {
          stack: err.stack,
        });
        if (i < QUEUE_ASSERT_RETRY_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, QUEUE_ASSERT_RETRY_DELAY_MS));
        }
      }
    }
    if (!assertSuccess) {
      logger.error(`Failed to assert queue '${QUEUE_NAME}' after ${QUEUE_ASSERT_RETRY_ATTEMPTS} attempts. Message will not be sent.`);
      return; // Do not proceed if queue assertion failed repeatedly
    }
    const queuePayload = Buffer.from(JSON.stringify(message));
    channel.sendToQueue(QUEUE_NAME, queuePayload, { persistent: true });
    logger.info("Message sent to queue:", { messageId: message.metadata.messageId, action: message.action });
  } catch (err) {
    logger.error("Failed to send message to queue (after queue assertion): ", err);
  }
}

export async function closeRabbitMQConnection() {
  if (channel) {
    try {
      await channel.close();
      logger.info("RabbitMQ channel closed.");
    } catch (err) {
      logger.error("Error closing RabbitMQ channel:", err);
    }
  }
  if (connection) {
    try {
      await connection.close();
      logger.info("RabbitMQ connection closed.");
    } catch (err) {
      logger.error("Error closing RabbitMQ connection:", err);
    }
  }
}
