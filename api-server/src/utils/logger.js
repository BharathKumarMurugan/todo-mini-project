import winston from "winston";
import path from "path";

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;

const jsonLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const logEntry = {
    timestamp,
    severity: level.toUpperCase(),
    message,
    ...metadata,
  };
  return JSON.stringify(logEntry);
});

const logDir = "/app/logs";
const apiServerLogFile = "api-server.log";
const apiServerErrorLogFile = "api-server-error.log";

const logger = createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSSZ" }), jsonLogFormat),
  transports: [
    new transports.File({ filename: path.join(logDir, apiServerLogFile) }), // combined log file
    new transports.File({ filename: path.join(logDir, apiServerErrorLogFile), level: "error" }), // api server error log file
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;
