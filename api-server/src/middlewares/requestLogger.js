/**
 * Middleware to handle logs for every API request
 * Logs the request method, URL, IP address, status code,response time and user agent
 */
import logger from "../utils/logger.js";

export default function requestLogger(req, res, next) {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const responseTimeMs = (diff[0] * 1e9 + diff[1]) / 1e6;
    logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      statusCode: res.statusCode,
      responseTimeMs: responseTimeMs.toFixed(2),
      userAgent: req.get("User-Agent"),
    });
  });
  next();
}
