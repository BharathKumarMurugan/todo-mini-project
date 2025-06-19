import jwt from "jsonwebtoken";

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized access",
    });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.AUTH_TOKEN, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "Forbidden access",
      });
    }
    req.user = user;
    next();
  });
}
