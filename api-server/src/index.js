import "dotenv/config";
import app from "./app.js";
import { connectToRabbitMQ } from "./utils/queue.js";
import logger from "./utils/logger.js";
import { connectToDB } from "./utils/db.js";

const PORT = process.env.API_PORT || 3000;

async function startServer() {
  try {
    await connectToRabbitMQ();
    await connectToDB();
    app.listen(PORT, () => {
      logger.info(`API server is running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start the api server: ", err);
    process.exit(1);
  }
}

startServer();
