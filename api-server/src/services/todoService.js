/**
 * Connects to RabbitMQ server and publishes messages to the queue
 */

import { publishToQueue } from "../utils/queue";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

export const queueNewTodo = async (taskData, user) => {
  const message = {
    action: "create",
    task: taskData,
    user: {
      userId: user.id,
      email: user.email,
    },
    metadata: {
      messageId: uuidv4(),
      createdAt: new Date().toISOString(),
      source: "api-server",
    },
  };
  await publishToQueue(message);
  return {
    status: "success",
    message: "Task queued successfully",
    taskId: taskData.id,
  };
};

export const queueUpdateTodo = async (taskId, updatedTask, user) => {
  const message = {
    action: "update",
    taskId,
    updatedTask,
    user: {
      userId: user.id,
      email: user.email,
    },
    metadata: {
      messageId: uuidv4(),
      createdAt: new Date().toISOString(),
      source: "api-server",
    },
  };
  await publishToQueue(message);
  return {
    status: "success",
    message: "Task queued successfully",
    taskId: taskData.id,
  };
};

export const queueDeleteTodo = async (taskId, user) => {
  const message = {
    action: "delete",
    taskId,
    user: {
      userId: user.id,
      email: user.email,
    },
    metadata: {
      messageId: uuidv4(),
      createdAt: new Date().toISOString(),
      source: "api-server",
    },
  };
  await publishToQueue(message);
  return {
    status: "success",
    message: "Task queued successfully",
    taskId: taskData.id,
  };
};

export const getTodos = async (user) => {
  return await todoModel.find({ userId: user.id }).exec();
};

export const getTodoById = async (taskId, user) => {
  return await todoModel.findById(taskId, { userId: user.id }).exec();
};
