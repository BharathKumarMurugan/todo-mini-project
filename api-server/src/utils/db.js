import mongoose from "mongoose";
import logger from "./logger.js";

const PORT = process.env.MONGODB_PORT || 27017;
const MONGODB_URI = process.env.MONGODB_URI;

export async function connectToDB() {
  try {
    const connection = mongoose.connect(MONGODB_URI);
    logger.info(`Connected to Database on port ${PORT}`);
    mongoose.connection.on("error", (err) => {
      logger.error("Mongoose connection error:", err);
    });
    mongoose.connection.on("disconnected", () => {
      logger.warn("Mongoose connection disconnected.");
    });
    mongoose.connection.on("reconnected", () => {
      logger.info("Mongoose connection reconnected.");
    });
    return connection;
  } catch (err) {
    logger.error("Failed to connect to Database: ", err);
    process.exit(1);
  }
}
