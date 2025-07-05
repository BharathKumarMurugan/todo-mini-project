import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Unauthorized access attempt without token");
    return res.status(401).json({
      error: "Unauthorized access",
      message: "Bearer token is required",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.AUTH_TOKEN, (err, user) => {
    if (err) {
      logger.warn(`Forbidden access attempt without valid token: ${err.message}`);
      return res.status(403).json({
        error: "Forbidden access",
        message: "Invalid or expired token",
      });
    }
    req.user = user;
    logger.info(`User authenticated successfully: ${user.id}`);
    next();
  });
}
