import winston from "winston";

const { createLogger, format, transports } = winston;
const { combine, timestamp } = format;

const logger = createLogger({
  level: "info",
  format: combine(timestamp(), format.json()),
  transports: [
    new transports.File({ filename: "api-server.log" }), // combined log file
    new transports.File({ filename: "api-server-error.log", level: "error" }), // api server error log file
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