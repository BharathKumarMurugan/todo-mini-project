export default function inputvalidator(req, res, next) {
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({
      error: "Invalid input",
      message: "Request body must contain a 'task' object.",
    });
  }

  const { title, description, status } = task;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Validation failed",
      message: "Title is required and must be a non-empty string.",
    });
  }
  if (!description || typeof description !== "string" || description.trim() === "") {
    return res.status(400).json({
      error: "Validation failed",
      message: "Description is required and must be a non-empty string.",
    });
  }
  if (status && !["pending", "in-progress", "completed"].includes(status)) {
    return res.status(400).json({
      error: "Validation failed",
      message: "Invalid status. Must be 'pending', 'in-progress', or 'completed'.",
    });
  }
  next();
}
