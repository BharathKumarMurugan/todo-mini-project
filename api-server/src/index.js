import "dotenv/config";
import app from "./app.js";
import { connectToRabbitMQ, closeRabbitMQConnection } from "./utils/queue.js";
import logger from "./utils/logger.js";
import { connectToDB } from "./utils/db.js";

const PORT = process.env.API_PORT || 3000;

async function startServer() {
  try {
    await connectToRabbitMQ();
    await connectToDB();

    const api_server = app.listen(PORT, () => {
      logger.info(`API server is running on port ${PORT}`);
    });

    // Gracefull shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Initiating graceful shutdown...`);
      try {
        await new Promise((resolve, reject) => {
          api_server.close((err) => {
            if (err) {
              logger.error("Error shuttingdown API server: ", err);
              return reject(err);
            }
            logger.info("API server is closed successfully.");
            resolve();
          });
        });

        await mongoose.connection.close();
        logger.info("MongoDB connection closed successfully.");
        await closeRabbitMQConnection();
        logger.info("RabbitMQ connection closed successfully.");
        logger.info("Exiting...");
        process.exit(0);
      } catch (err) {
        logger.error("Error during gracefull shutdown: ", err);
        process.exit(1);
      }
    };
    process.on("SIGINT", async () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", async () => gracefulShutdown("SIGTERM"));
  } catch (err) {
    logger.error("Failed to start the api server: ", err);
    process.exit(1);
  }
}

startServer();
