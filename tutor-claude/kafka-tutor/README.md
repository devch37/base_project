# Kafka Tutor (Java 21 + Spring Boot)

Production-style Kafka examples from basic MQ usage to streaming and outbox patterns.

## Stack

- Java 21
- Spring Boot 3.4
- Spring for Apache Kafka
- Kafka Streams
- H2 (for outbox demo)

## Quick Start

1) Start Kafka

```bash
docker compose up -d
```

2) Run app

```bash
./gradlew bootRun
```

## Example Endpoints

### Basic MQ-style publish

```bash
curl -X POST http://localhost:8080/api/orders/basic \
  -H "Content-Type: application/json" \
  -d '{"customerId":"c-100","amount":120.50}'
```

### Outbox pattern (DB + async publish)

```bash
curl -X POST http://localhost:8080/api/orders/outbox \
  -H "Content-Type: application/json" \
  -d '{"customerId":"c-200","amount":45.00}'
```

### Transactional Kafka producer

```bash
curl -X POST http://localhost:8080/api/orders/transactional \
  -H "Content-Type: application/json" \
  -d '{"customerId":"c-300","amount":89.00}'
```

### Force failure to DLT

```bash
curl -X POST http://localhost:8080/api/orders/force-fail \
  -H "Content-Type: application/json" \
  -d '{"customerId":"c-400","amount":10.00}'
```

## Features Covered

- Basic producer/consumer flow
- Manual ack and retry with DLT
- Idempotent + transactional producer
- Outbox pattern for reliable publishing
- Kafka Streams aggregation (`order.events` -> `order.events.counts`)

## Kafka Concepts (Basic -> Advanced)

### 1) Topic and Partition

- Topic is a logical stream; partitions are the physical shards.
- Ordering is guaranteed per partition, not across the whole topic.
- Parallelism comes from partitions: more partitions allow more consumer instances in a group.

### 2) Broker and Cluster

- A broker is a Kafka server; a cluster is a group of brokers.
- Each partition has a leader and replicas for fault tolerance.
- Replication factor controls how many brokers hold a copy of each partition.

### 3) Producer Basics

- Producers send records with a key and a value.
- The key decides partitioning (same key => same partition => ordering).
- Acks (`acks=all`) and retries help with durability.

### 4) Consumer Basics

- Consumers read from partitions and commit offsets.
- Offsets track how far the consumer processed.
- `enable.auto.commit=false` + manual ack gives you control.

### 5) Consumer Groups

- A group shares work: each partition is assigned to one consumer in the group.
- Rebalancing happens when consumers join/leave or partitions change.
- To scale, increase partitions and run more consumers.

### 6) Delivery Semantics

- At-most-once: commit before processing (possible loss).
- At-least-once: commit after processing (possible duplicates).
- Exactly-once: requires idempotent producers + transactions and careful consumer design.

### 7) Idempotent Producer and Transactions

- Idempotence prevents duplicate writes on retries.
- Transactions ensure multiple sends are committed atomically.
- Used for reliable pipelines and stateful stream processing.

### 8) Dead Letter Topic (DLT)

- Failed messages are moved to a DLT after retries.
- This keeps the main flow moving while isolating failures.
- DLT consumers can alert or reprocess later.

### 9) Outbox Pattern

- Write business data and event in the same DB transaction.
- A background publisher reads outbox and sends to Kafka.
- Avoids "DB committed but Kafka send failed" inconsistencies.

### 10) Kafka Streams

- Streams is a library for stateful processing (joins, aggregates).
- It manages state stores and uses Kafka for durability.
- Useful for real-time analytics and event-driven projections.

### 11) Schema and Compatibility (Advanced)

- Schemas prevent breaking changes in event payloads.
- Use Schema Registry with Avro/Protobuf in production.
- Enforce backward compatibility to keep consumers safe.

### 12) Operational Basics (Advanced)

- Monitor lag, throughput, and error rates.
- Plan partitions with future scale in mind.
- Avoid too many partitions for small traffic (metadata overhead).

## Code Map

- Producer config + DLT: `config/KafkaConfig.java`
- Topics: `config/TopicProperties.java`
- Outbox: `outbox/OutboxService.java`, `outbox/OutboxPublisher.java`
- Streams: `stream/KafkaStreamsConfig.java`
- MQ-style consumers: `consumer/*`
- REST API: `controller/OrderController.java`
