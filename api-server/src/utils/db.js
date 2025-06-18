import mongoose from "mongoose";
import { logger } from "./logger";

const PORT = process.env.MONGODB_PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

export async function connectToDB() {
  try {
    const connection = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`Connected to Database on port ${PORT}`);
    return connection;
  } catch (err) {
    logger.error("Failed to connect to Database: ", err);
    process.exit(1);
  }
}
