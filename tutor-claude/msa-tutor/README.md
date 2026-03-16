# MSA Tutor

A production-style MSA example with Java 21 + Spring Boot. It demonstrates:

- Service boundaries and data ownership
- Asynchronous integration via Kafka
- Idempotent API patterns
- Event-driven workflows
- Operational basics for real teams

## Services

- `api-gateway` (single entrypoint, JWT validation, routing)
- `auth-service` (user registration/login, JWT issuance)
- `order-service` (REST entry, order lifecycle, outbox + saga)
- `payment-service` (listens to order events, publishes payment results)
- `inventory-service` (reserves inventory asynchronously, releases on cancel)
- `notification-service` (sends user notifications on domain events)
- `common` (shared contracts: EventEnvelope, headers)

## How To Run (Local)

1) Start Kafka

```bash
docker compose up -d
```

2) Start services (separate terminals)

```bash
./gradlew :api-gateway:bootRun
./gradlew :auth-service:bootRun
./gradlew :order-service:bootRun
./gradlew :payment-service:bootRun
./gradlew :inventory-service:bootRun
./gradlew :notification-service:bootRun
```

3) Register/Login to get a token

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@local.dev","password":"User12345!"}'
```

4) Create an order through gateway

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 7f6b2e2a-1a2b-4d3e-8b2e-111122223333" \
  -H "X-Correlation-Id: corr-001" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"customerId":"c-100","amount":120.50}'
```

Note: the JWT secret in `api-gateway` and `auth-service` must match.

## Request Flow (High Level)

1) `api-gateway` validates JWT and routes requests.
2) `order-service` persists the Order and writes an Outbox event.
3) `order-service` outbox publisher emits `ORDER_CREATED`.
4) `payment-service` consumes `ORDER_CREATED` and emits `PAYMENT_APPROVED` or `PAYMENT_FAILED`.
5) On `PAYMENT_FAILED`, `order-service` emits `ORDER_CANCELLED` (compensation).
6) `inventory-service` consumes `ORDER_CREATED` and reserves stock.
7) `inventory-service` consumes `ORDER_CANCELLED` and releases stock.
8) `notification-service` consumes domain events and logs notifications.

## MSA Concepts (Basic -> Advanced)

### 1) Service Boundaries

- Each service owns its data and business rules.
- Cross-service data is shared via events, not direct DB access.

### 2) Synchronous vs Asynchronous

- Use REST for immediate user-facing commands.
- Use events for cross-service coordination and scalability.

### 3) API Gateway and Auth

- Gateway is the single entrypoint for auth, routing, and cross-cutting concerns.
- Auth service owns credentials and issues JWT tokens.

### 4) Data Ownership and Consistency

- Each service has its own database or schema.
- Expect eventual consistency; design for it from day one.

### 5) Idempotency

- APIs must handle retries (client/network failures).
- Use `Idempotency-Key` to prevent duplicate orders.

### 6) Correlation and Tracing

- Use `X-Correlation-Id` to tie logs and events together.
- Required for debugging distributed flows.

### 7) Transactions Across Services

- There is no global ACID transaction across services.
- Use Saga (orchestration or choreography) and compensating actions.

### 8) Outbox Pattern

- Persist domain data and events together.
- Publish events after commit to avoid lost updates.
 - This project uses a polling outbox publisher in `order-service`.

### 9) Consumer Resilience

- Consumers must be idempotent.
- Handle duplicates and out-of-order messages gracefully.

### 10) Contract and Schema Management

- Define event schemas and version them.
- Keep backward compatibility for consumers.

### 11) Observability

- Centralized logs + metrics + tracing.
- Track Kafka lag, error rate, and end-to-end latency.
 - Actuator endpoints are enabled on each service.

### 12) Deployment and Scaling

- Scale services independently based on load.
- Increase Kafka partitions to scale consumers.

### 13) Security and Governance

- Use service-to-service auth (mTLS/OAuth2).
- Apply least privilege and audit access.

## Code Map

- Gateway JWT validation: `api-gateway/src/main/java/be/com/msatutor/gateway/security/JwtAuthFilter.java`
- Auth token issuance: `auth-service/src/main/java/be/com/msatutor/auth/security/JwtTokenService.java`
- Order API + idempotency: `order-service/src/main/java/be/com/msatutor/order/api/OrderController.java`
- Outbox publisher: `order-service/src/main/java/be/com/msatutor/order/outbox/OutboxPublisher.java`
- Payment consumer + publisher: `payment-service/src/main/java/be/com/msatutor/payment/infra/OrderCreatedConsumer.java`
- Shared event envelope: `common/src/main/java/be/com/msatutor/common/event/EventEnvelope.java`

## Notes

- This project focuses on architecture and patterns, not UI.
- Replace H2 with Postgres and add centralized observability in real usage.
