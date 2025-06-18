/**
 * Connects to RabbitMQ server and publishes messages to the queue
 */

import { publishToQueue } from "../utils/queue";
import { logger } from "../utils/logger";

exports.queueNewTodo = async (taskData, user) => {
  const message = {
    action: "create",
    task: taskData,
    user: {
      userId: user.id,
      email: user.email,
    },
    metadata: {
      messageId: "",
      createdAt: new Date().toISOString(),
      source: "api-server",
    },
  };

  await publishToQueue(message);
  return {
    status: "success",
    message: "Task queued successfully",
    tasId: taskData.id,
  };
};
