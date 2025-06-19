import express from "express";
import { getAllTodos, getOneTodoById, createTodo, updateTodo, deleteTodo } from "../controllers/todoController.js";
import authenticate from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticate, getAllTodos);
router.get("/:id", authenticate, getOneTodoById);
router.put("/:id", authenticate, updateTodo);
router.post("/", authenticate, createTodo);
router.delete("/:id", authenticate, deleteTodo);

export default router;
