/**
 * Connects to RabbitMQ server and publishes messages to the queue
 */

import { publishToQueue } from "../utils/queue.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import todoModel from "../models/Todo.js";

export const queueNewTodo = async (taskData, user) => {
  const messageId = uuidv4();
  const message = {
    action: "create",
    task: {
      ...taskData,
      // userId: user.id
    },
    user: {
      userId: user.id,
      email: user.email,
    },
    metadata: {
      messageId: messageId,
      createdAt: new Date().toISOString(),
      source: "api-server",
    },
  };
  await publishToQueue(message);
  return {
    status: "success",
    message: "Task queued successfully",
    messageId: messageId,
  };
};

export const queueUpdateTodo = async (taskId, updatedTask, user) => {
  const messageId = uuidv4();
  const message = {
    action: "update",
    _id: taskId,
    task: {
      ...updatedTask,
      // userId: user.id
    },
    user: {
      userId: user.id,
      email: user.email,
    },
    metadata: {
      messageId: messageId,
      createdAt: new Date().toISOString(),
      source: "api-server",
    },
  };
  await publishToQueue(message);
  return {
    status: "success",
    message: "Task queued successfully",
    messageId: messageId,
  };
};

export const queueDeleteTodo = async (taskId, user) => {
  const messageId = uuidv4();
  const message = {
    action: "delete",
    _id: taskId,
    user: {
      userId: user.id,
      email: user.email,
    },
    metadata: {
      messageId: messageId,
      createdAt: new Date().toISOString(),
      source: "api-server",
    },
  };
  await publishToQueue(message);
  return {
    status: "success",
    message: "Task queued successfully",
    messageId: messageId,
  };
};

export const getTodos = async (user) => {
  return await todoModel.find({ 'user.userId': user.id }).exec();
};

export const getTodoById = async (taskId, user) => {
  return await todoModel.findById({ _id: taskId, 'user.userId': user.id }).exec();
};
