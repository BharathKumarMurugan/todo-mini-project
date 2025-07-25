import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
    collection: "tasks",
  }
);

const todoModel = mongoose.model("Todo", todoSchema);

export default todoModel;
