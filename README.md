# Webhook Pipeline

A webhook-driven task processing pipeline service that receives events, processes them asynchronously, and delivers results to subscribers.

## What is this?

This service allows you to:
- Receive incoming webhooks
- Process them in the background using a queue
- Deliver the processed result to one or more subscribers

Think of it as a simplified automation system similar to Zapier.

## Example Flow

1. Send a webhook:
```http
POST /webhooks/abc123
```
```json
{
  "event": "user.created",
  "data": { "name": "Ahmad" }
}
```

2. The system queues the job and processes it (transform / filter / enrich)

3. Delivers result to subscribers:
```json
{
  "event": "user.created",
  "data": { "name": "Ahmad" },
  "_metadata": { "processed_at": "2026-01-01T12:00:00Z" }
}
```

## Architecture
```
Incoming Webhook → API → Queue (Redis/BullMQ) → Worker → Subscribers
```

### Components

- **API** — Handles pipeline CRUD and receives incoming webhooks
- **Worker** — Picks up jobs from the queue and processes them
- **PostgreSQL** — Stores pipelines, jobs, subscribers, and delivery attempts
- **Redis** — Powers the job queue using BullMQ

## Setup

### Prerequisites

- Docker
- Docker Compose

### Run the service
```bash
git clone https://github.com/ahmadtomeh03/webhook-pipeline.git
cd webhook-pipeline
docker compose up
```

API will be available at `http://localhost:3000`

## API Documentation

### Health Check
```
GET /health
```

### Pipelines

#### Create
```
POST /pipelines
```
```json
{
  "name": "My Pipeline",
  "action_type": "transform",
  "action_config": {},
  "subscribers": ["https://example.com/webhook"]
}
```

#### List
```
GET /pipelines
```

#### Get one
```
GET /pipelines/:id
```

#### Update
```
PATCH /pipelines/:id
```

#### Delete
```
DELETE /pipelines/:id
```

### Webhooks

#### Send a webhook
```
POST /webhooks/:sourceId
```

Response:
```json
{
  "message": "Webhook received and queued",
  "job_id": "uuid"
}
```

### Jobs

#### Get job status
```
GET /jobs/:id
```

#### List jobs
```
GET /jobs?pipeline_id=uuid
```

## Processing Actions

### transform
Modify payload structure using `pick` or `rename`.
```json
{
  "action_type": "transform",
  "action_config": {
    "pick": ["event", "data"]
  }
}
```

### filter
Stop processing if a condition is not met. Supports `eq`, `neq`, `exists`, `contains`.
```json
{
  "action_type": "filter",
  "action_config": {
    "field": "event",
    "operator": "eq",
    "value": "user.created"
  }
}
```

### enrich
Add metadata such as timestamp, source name, hash, or static fields.
```json
{
  "action_type": "enrich",
  "action_config": {
    "source_name": "my-service",
    "add_hash": true,
    "static_fields": {
      "environment": "production"
    }
  }
}
```

## Delivery and Retry Logic

Results are delivered via HTTP POST to all subscriber URLs. Failed deliveries are retried up to 3 times with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 2 seconds |
| 3 | 4 seconds |

Every attempt is recorded in the database and queryable via the jobs API.

## Design Decisions

**Why BullMQ?**
Webhooks are processed asynchronously so the API responds immediately without waiting for processing to complete.

**Why a separate worker process?**
The API and worker run independently, allowing them to scale separately under load.

**Why PostgreSQL?**
Job history and delivery attempts need to be persistent and queryable with relational integrity between pipelines, jobs, and subscribers.

**Webhook URL design**
Each pipeline gets a unique `source_id` that forms its webhook endpoint, allowing multiple isolated pipelines to coexist.

## CI/CD

GitHub Actions runs on every push to `main`:
1. Install dependencies
2. Type check and build TypeScript
3. Build Docker images
