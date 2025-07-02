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

| Component        | Tool/Tech Used                   |
|------------------|----------------------------------|
| API Server       | Node.js + Express.js             |
| Queue System     | RabbitMQ                         |
| Worker           | Python                           |
| Database         | MongoDB                          |
| Load Balancer    | NGINX                            |
| Authentication   | Simple custom token-based auth   |
| Logging          | ELK Stack (Elasticsearch + Logstash + Kibana) *(or EFK: Fluentd instead of Logstash)* |
| Monitoring       | Prometheus + Grafana *(optional)* |
| Rate Limiting    | `express-rate-limit` (Node.js)   |
| Health Checks    | `/api/health` endpoint           |
| Retry Mechanism  | Built into worker logic (manual retry w/ backoff) |

---

## 🔗 API Endpoints

### Task Management APIs

| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| `POST`    | `/api/todos`             | Create a new task (queued)           |
| `GET`     | `/api/todos`             | Fetch all tasks                      |
| `GET`     | `/api/todos/:id`         | Fetch task by ID                     |
| `PUT`     | `/api/todos/:id`         | Update task details                  |
| `PATCH`   | `/api/todos/:id/status`  | Update only task status              |
| `DELETE`  | `/api/todos/:id`         | Delete a task                        |

### System APIs

| Method | Endpoint         | Description               |
|--------|------------------|---------------------------|
| `GET`  | `/api/health`    | Returns system health     |
| `GET`  | `/api/metrics` *(optional)* | System metrics/logs    |

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
  "id": "abc123",
  "title": "Buy groceries",
  "description": "Milk, bread, eggs",
  "dueDate": "2025-06-06T18:00:00Z",
  "status": "pending"
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

- Retry & Dead Letter Queue for failed tasks
- WebSocket or polling to show real-time task processing
- JWT-based authentication or OAuth integration
- UI with React or Vue.js
- RBAC/Permissions

---

## 📌 Notes

- All write operations (`POST`, `PUT`, `DELETE`) are **queued** and processed asynchronously by a Python worker.
- The worker directly interacts with the database and logs processing events.
- The client receives a **confirmation of queuing**, not immediate DB result.
- Monitoring and logging are essential to understand system behavior.

---

> 👨‍💻 This project is built for learning purposes and can be extended into a production-grade app with additional tooling, scaling, and security layers.
