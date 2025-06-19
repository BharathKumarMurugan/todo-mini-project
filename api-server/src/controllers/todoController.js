import { queueNewTodo, queueUpdateTodo, getTodos, getTodoById, queueDeleteTodo } from "../services/todoService.js";
import logger from "../utils/logger.js";

export const createTodo = async (req, res) => {
  try {
    const result = await queueNewTodo(req.body, req.user);
    res.status(202).json({
      status: "success",
      taskId: result.taskId,
    });
    logger.info("Todo created successfully: ", result.taskId);
  } catch (err) {
    logger.error("Error creating todo:", err);
    res.status(500).json({
      error: "Failed to create todo",
    });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const result = await queueUpdateTodo(req.params.id, req.body, req.user);
    res.status(202).json({
      status: "success",
      taskId: result.taskId,
    });
    logger.info("Todo updated successfully:", result.taskId);
  } catch (err) {
    logger.error("Error updating todo:", err);
    res.status(500).json({
      error: "Failed to update todo",
    });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const result = await queueDeleteTodo(req.params.id, req.user);
    res.status(202).json({
      status: "success",
      taskId: result.taskId,
    });
    logger.info("Todo deleted successfully:", result.taskId);
  } catch (err) {
    logger.error("Error deleting todo:", err);
    res.status(500).json({
      error: "Failed to delete todo",
    });
  }
};

export const getAllTodos = async (req, res) => {
  try {
    const result = await getTodos(req.user);
    res.status(200).json({
      status: "success",
      todos: result.todos,
    });
    logger.info("Todos retrieved successfully:", result, result.todos.length);
  } catch (err) {
    logger.error("Error retrieving todos:", err);
    res.status(500).json({
      error: "Failed to retrieve todos",
    });
  }
};

export const getOneTodoById = async (req, res) => {
  try {
    const result = await getTodoById(req.params.id, req.user);
    if (!result) {
      res.status(404).json({
        status: "Not found",
      });
    }
    res.status(200).json({
      status: "success",
      todos: result.todos,
    });
    logger.info("Todo retrieved successfully:", result);
  } catch (err) {
    logger.error("Error retrieving todo:", err);
    res.status(500).json({
      error: "Failed to retrieve todo",
    });
  }
};
