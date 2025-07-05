# 📝 Asynchronous ToDo Web Application

This is a proof-of-concept (POC) **ToDo application** built using modern open-source tools. It follows a **decoupled microservices** architecture with a **Node.js API**, **RabbitMQ message queue**, **Python worker**, and **MongoDB database**, backed by a logging and monitoring system. It is designed for learning and self-exploration.

---

## 📊 Application Data Flow

```
[Client/UI]
     |
     v
[NGINX Load Balancer]
     |
     v
[API Server (Node.js/Express.js)] ---> [Rate Limiter / Auth Middleware / Health Check]
     |
     v
[Message Queue (RabbitMQ)]
     |
     v
[Worker Node (Python)] ---> [MongoDB]
                         |
                         +--> [Logger]
```

---

## 🛠️ Tech Stack

| Component       | Tool/Tech Used                                                                        |
| --------------- | ------------------------------------------------------------------------------------- |
| API Server      | Node.js + Express.js                                                                  |
| Queue System    | RabbitMQ                                                                              |
| Worker          | Python                                                                                |
| Database        | MongoDB                                                                               |
| Load Balancer   | NGINX                                                                                 |
| Authentication  | Simple custom token-based auth                                                        |
| Logging         | ELK Stack (Elasticsearch + Logstash + Kibana) _(or EFK: Fluentd instead of Logstash)_ |
| Monitoring      | Prometheus + Grafana _(optional)_                                                     |
| Rate Limiting   | `express-rate-limit` (Node.js)                                                        |
| Health Checks   | `/api/health` endpoint                                                                |
| Retry Mechanism | Built into worker logic (manual retry w/ backoff)                                     |

---

## 🔗 API Endpoints

### Task Management APIs

| Method   | Endpoint                | Description                |
| -------- | ----------------------- | -------------------------- |
| `POST`   | `/api/todos`            | Create a new task (queued) |
| `GET`    | `/api/todos`            | Fetch all tasks            |
| `GET`    | `/api/todos/:id`        | Fetch task by ID           |
| `PUT`    | `/api/todos/:id`        | Update task details        |
| `PATCH`  | `/api/todos/:id/status` | Update only task status    |
| `DELETE` | `/api/todos/:id`        | Delete a task              |

### System APIs

| Method | Endpoint                    | Description           |
| ------ | --------------------------- | --------------------- |
| `GET`  | `/api/health`               | Returns system health |
| `GET`  | `/api/metrics` _(optional)_ | System metrics/logs   |

---

## 📨 Message Format (Queued to RabbitMQ)

```json
{
  "action": "create",
  "task": {
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "dueDate": "2025-06-06T18:00:00Z",
    "status": "pending"
  },
  "user": {
    "userId": "abc123",
    "email": "user@example.com"
  },
  "metadata": {
    "messageId": "uuid-abc-123",
    "createdAt": "2025-06-04T12:15:00Z",
    "source": "api-server"
  }
}
```

---

## ✅ Sample API Responses

### `POST /api/todos`

```json
[
  {
    "action": "create",
    "task": {
      "title": "Task 1",
      "description": "This is the first task",
      "dueDate": "2025-07-02T04:23:44.370Z",
      "status": "pending"
    },
    "user": {
      "userId": "user1",
      "email": "user1@test.com"
    },
    "metadata": {
      "messageId": "uuid-user1-123",
      "createdAt": "2025-06-30T04:23:44.370Z",
      "source": "api-server"
    }
  },
  {
    "action": "create",
    "task": {
      "title": "Task 1",
      "description": "This is the first task",
      "dueDate": "2025-07-02T04:23:44.370Z",
      "status": "pending"
    },
    "user": {
      "userId": "user2",
      "email": "user2@test.com"
    },
    "metadata": {
      "messageId": "uuid-user2-123",
      "createdAt": "2025-06-30T04:23:45.370Z",
      "source": "api-server"
    }
  },
  {
    "action": "create",
    "task": {
      "title": "Task 2",
      "description": "This is the second task",
      "dueDate": "2025-07-03T04:23:44.370Z",
      "status": "pending"
    },
    "user": {
      "userId": "user1",
      "email": "user1@test.com"
    },
    "metadata": {
      "messageId": "uuid-user1-123",
      "createdAt": "2025-06-30T04:23:46.370Z",
      "source": "api-server"
    }
  },
  {
    "action": "create",
    "task": {
      "title": "Task 1",
      "description": "This is the first task",
      "dueDate": "2025-07-03T04:23:44.370Z",
      "status": "pending"
    },
    "user": {
      "userId": "user3",
      "email": "user3@test.com"
    },
    "metadata": {
      "messageId": "uuid-user3-123",
      "createdAt": "2025-06-30T04:24:46.370Z",
      "source": "api-server"
    }
  }
]
```

### `GET /api/todos/:id`

```json
{
  "_id": "6864da8eff18e043b6a9d2b5",
  "task": {
    "title": "Task 1",
    "description": "This is the first task",
    "dueDate": "2025-07-03T04:23:44.370Z",
    "status": "pending"
  },
  "user": {
    "userId": "user1",
    "email": "user1@test.com"
  },
  "metadata": {
    "messageId": "uuid-user1-123",
    "createdAt": "2025-06-30T04:24:46.370Z",
    "source": "api-server"
  }
}
```

### `PUT /api/todos/:id`

```json
[
  {
    "action": "update",
    "_id": "6864da8eff18e043b6a9d2b5",
    "task": {
      "title": "Task 1",
      "description": "This is the first task",
      "dueDate": "2025-07-03T04:23:44.370Z",
      "status": "completed"
    },
    "user": {
      "userId": "user1",
      "email": "user1@test.com"
    },
    "metadata": {
      "messageId": "uuid-user1-123",
      "createdAt": "2025-06-30T04:24:46.370Z",
      "source": "api-server"
    }
  },
  {
    "action": "update",
    "_id": "6864dad6ff18e043b6a9d2b8",
    "task": {
      "title": "Task 1 of user 3",
      "description": "This is the first task of the third user",
      "dueDate": "2025-07-03T04:23:44.370Z",
      "status": "pending"
    },
    "user": {
      "userId": "user1",
      "email": "user1@test.com"
    },
    "metadata": {
      "messageId": "uuid-user1-123",
      "createdAt": "2025-06-30T04:24:46.370Z",
      "source": "api-server"
    }
  }
]
```

### `DELETE /api/todos/:id`

```json
{
  "action": "delete",
  "_id": "6864dabfff18e043b6a9d2b6"
}
```

### `GET /api/health`

```json
{
  "status": "ok",
  "services": {
    "apiServer": "up",
    "queue": "connected",
    "worker": "healthy",
    "db": "connected"
  },
  "timestamp": "2025-06-04T10:21:00Z"
}
```

---

## 🧪 Future Enhancements (Optional)

- A separate authentication service.
- WebSocket or polling to show real-time task processing.
- Use a user database to store user details.
- Use redis cache to store frequently access data.

---

> 👨‍💻 This project is built for learning purposes and can be extended into a production-grade app with additional tooling, scaling, and security layers.

## Local Setup

use the below `.env` format to run the application locally.

`.env` for API-server

```
# api-server/.env

# Express APP
API_PORT=3000
API_HOST=localhost
API_BASE_URL=http://localhost:3000/api

# QUEUE server
QUEUE_URL=amqp://rabbitmq
QUEUE_NAME=taskqueue
DQUEUE_NAME=dead_letter_queue
DQUEUE_EXCHANGE=dead_letter_exchange

# MongoDB
MONGODB_PORT=27017
MONGODB_URI=mongodb://mongodb:27017/todo-app
MONGODB_DATABASE=todo-app

# JWT Auth Token
AUTH_TOKEN=paste your token here

# Application Environment
NODE_ENV=development
```

`.env` for Worker node

```
# worker-node/.env

# Flask APP
WORKER_NODE_PORT=3001
WORKER_NODE_HOST=localhost

# QUEUE Server
QUEUE_URL=amqp://rabbitmq
QUEUE_HOST=localhost
QUEUE_NAME=taskqueue
DQUEUE_NAME=dead_letter_queue
DQUEUE_EXCHANGE=dead_letter_exchange
MAX_RETRIES=5

# MongoDB
MONGODB_PORT=27017
MONGODB_URI=mongodb://mongodb:27017/todo-app
MONGODB_DATABASE=todo-app
MONGODB_COLLECTION=tasks
```
