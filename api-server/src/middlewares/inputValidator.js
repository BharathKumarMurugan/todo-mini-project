export default function inputvalidator(req, res, next) {
  const { title, description, status } = req.body;

  if (!title || typeof title !== String) {
    return res.status(400).json({
      error: "Title is required and must be a string",
    });
  }
  if (!description || typeof description !== String) {
    return res.status(400).json({
      error: "Description is required and must be a string",
    });
  }
  if (status && ["pending", "in-progress", "completed"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status",
    });
  }
  next();
}
