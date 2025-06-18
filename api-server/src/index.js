import "dotenv/config";

import express, { request, response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import amqplib from "amqplib";
import { logger } from "./utils/logger.js";

const app = express();

const PORT = process.env.API_PORT || 3000;

let channel;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(bodyParser.json());
app.use(express.json());

/**
 * Connects to RabbitMQ server and sets up the channel
 */
async function connectToRabbitMQ() {
  try {
    const conn = await amqplib.connect(process.env.QUEUE_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(process.env.QUEUE_NAME, { durable: false });
    logger.info("Connected to Queue server");
  } catch (err) {
    logger.error("Failed to connect to Queue server: ", err);
    process.exit(1);
  }
}

/**
 * Middleware to handle logs for every API request
 * Logs the request method, URL, IP address, status code,response time and user agent
 */
app.use((req, res, next) => {
  res.on("finish", () => {
    logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      statusCode: res.statusCode,
      responseTimeMs: res.get("X-Response-Time"),
      userAgent: req.get("User-Agent"),
    });
  });
  next();
});

app.get("/", (req, res) => {
  const message = {
    message: "Hello from API server",
    status: "success",
  };
  res.status(200).json(message);
});

app.get("/health", (req, res) => {
  const message = {
    message: "API server is healthy",
    status: "success",
  };
  res.status(200).json(message);
});

// connectToRabbitMQ().then(() => {
app.listen(PORT, () => {
  logger.info(`API server is running on port ${PORT}`);
});
// });
