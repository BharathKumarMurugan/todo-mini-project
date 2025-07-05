import express from "express";
import { getAllTodos, getOneTodoById, createTodo, updateTodo, deleteTodo } from "../controllers/todoController.js";
import authenticate from "../middlewares/auth.js";
import inputvalidator from "../middlewares/inputValidator.js";

const router = express.Router();

router.get("/", authenticate, getAllTodos);
router.get("/:id", authenticate, getOneTodoById);
router.put("/:id", authenticate, inputvalidator, updateTodo);
router.post("/", authenticate, inputvalidator, createTodo);
router.delete("/:id", authenticate, deleteTodo);

export default router;
