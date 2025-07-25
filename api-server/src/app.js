import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import todoRoutes from "./routes/todoRoutes.js";
import requestLogger from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";
import { rateLimit } from "express-rate-limit";

const app = express();

// Configure CORS for all origins and methods
app.use(
  cors({
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(bodyParser.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(bodyParser.json());
app.use(express.json());

app.use(requestLogger);

// defining rate limitor
const apiLimitor = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100, // limit 20 calls per machine per 15 minutes
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimitor);

app.get("/", (req, res) => {
  const message = {
    message: "Hello from API server",
    status: "success",
  };
  res.status(200).json(message);
  logger.info("Root endpoint accessed.");
});

app.get("/health", (req, res) => {
  const message = {
    message: "API server is healthy",
    status: "success",
  };
  res.status(200).json(message);
  logger.info("Health check endpoint accessed.");
});

app.use("/api/todos", todoRoutes);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, path: req.originalUrl, method: req.method });
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong on the server.",
  });
});

export default app;
