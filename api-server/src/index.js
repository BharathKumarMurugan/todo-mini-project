import "dotenv/config";

import express, { request, response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import amqplib from "amqplib";

const app = express();

const PORT = process.env.API_PORT || 3000;

let channel;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(bodyParser.json());
app.use(express.json());

async function connectToRabbitMQ() {
  try {
    const conn = await amqplib.connect(process.env.QUEUE_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(process.env.QUEUE_NAME, { durable: false });
    console.log("Connected to Queue server");
  } catch (err) {
    console.error("Failed to connect to Queue server: ", err);
    process.exit(1);
  }
}

app.get("/", (req, res) => {
  const message = {
    message: "Hello from API server",
    status: "success",
  };
  res.status(200).json(message);
});

// connectToRabbitMQ().then(() => {
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
// });
