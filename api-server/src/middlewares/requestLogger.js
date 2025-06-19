/**
 * Middleware to handle logs for every API request
 * Logs the request method, URL, IP address, status code,response time and user agent
 */
import logger from "../utils/logger.js";

export default function requestLogger(req, res, next) {
  res.on("finish", () => {
    logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      statusCode: res.statusCode,
      responseTimeMs: res.get("X-Response-Time"),
      userAgent: req.get("User-Agent"),
    });
  });
  next();
}
