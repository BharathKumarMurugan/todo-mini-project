import amqplib from "amqplib";
import logger from "./logger.js";

let channel;

/**
 * Connects to RabbitMQ server and sets up the channel
 */
export async function connectToRabbitMQ() {
  try {
    const conn = await amqplib.connect(process.env.QUEUE_URL);
    channel = await conn.createChannel();
    logger.info("Connected to RabbitMQ server");
  } catch (err) {
    logger.error("Failed to connect to Queue server: ", err);
    process.exit(1);
  }
}

export async function publishToQueue(message) {
  try {
    if (!channel) {
      logger.error("Channel is not initialized.");
    }
    await channel.assertQueue(process.env.QUEUE_NAME, { durable: false });
  } catch (err) {
    logger.error("Failed to assert queue: ", err);
  }
  try {
    const queuePayload = Buffer.from(JSON.stringify(message));
    channel.sendToQueue(process.env.QUEUE_NAME, queuePayload);
    logger.info("Message sent to queue: ", message);
  } catch (err) {
    logger.error("Failed to send message to queue: ", err);
  }
}
