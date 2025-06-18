import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(bodyParser.json());
app.use(express.json());

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

module.exports = app;