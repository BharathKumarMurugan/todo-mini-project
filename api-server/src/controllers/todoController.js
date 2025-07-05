import { queueNewTodo, queueUpdateTodo, getTodos, getTodoById, queueDeleteTodo } from "../services/todoService.js";
import logger from "../utils/logger.js";

export const createTodo = async (req, res) => {
  try {
    const result = await queueNewTodo(req.body.task, req.user);
    res.status(202).json({
      status: "success",
      taskId: result.messageId,
    });
    logger.info("Todo created successfully: ", result.messageId);
  } catch (err) {
    logger.error("Error creating todo:", err);
    res.status(500).json({
      error: "Failed to create todo",
    });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const result = await queueUpdateTodo(req.params.id, req.body.task, req.user);
    res.status(202).json({
      status: "success",
      taskId: result.messageId,
    });
    logger.info(`Todo updated successfully ID: ${req.params.id}, messageId: ${result.messageId}`);
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
      taskId: result.messageId,
    });
    logger.info(`Todo deleted successfully ID: ${req.params.id}, messageId: ${result.messageId}`);
  } catch (err) {
    logger.error("Error deleting todo:", err);
    res.status(500).json({
      error: "Failed to delete todo",
    });
  }
};

export const getAllTodos = async (req, res) => {
  try {
    const todos = await getTodos(req.user);
    res.status(200).json({
      status: "success",
      todos: todos,
    });
    logger.info(`Todos retrieved successfully for user: ${req.user.id}, count :${todos.length}`);
  } catch (err) {
    logger.error("Error retrieving todos:", err);
    res.status(500).json({
      error: "Failed to retrieve todos",
    });
  }
};

export const getOneTodoById = async (req, res) => {
  try {
    const todo = await getTodoById(req.params.id, req.user);
    if (!todo) {
      res.status(404).json({
        status: "Not found",
      });
    }
    res.status(200).json({
      status: "success",
      todo: todo,
    });
    logger.info("Todo retrieved successfully:", todo);
  } catch (err) {
    logger.error("Error retrieving todo:", err);
    res.status(500).json({
      error: "Failed to retrieve todo",
    });
  }
};
