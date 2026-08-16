# Trading Order Management System (TOMS)

A multi-tenant trading platform with a Spring Boot backend and a React frontend. Orders flow through a real matching engine, execute as trades, and push live over WebSocket to the UI:

```
React (RTK Query) → POST /api/v1/orders
  → JwtAuthenticationFilter (validates Bearer token, extracts tenantId)
  → OrderController (validates, saves to PostgreSQL)
  → KafkaProducerService (publishes to "orders" topic)
  → KafkaConsumerService (consumes, routes to user)
  → WebSocket /user/queue/orders  (per-user, private)
  → Frontend STOMP subscription → Redux dispatch → UI update
```

## Features

- **Order matching engine** — price-time priority for LIMIT orders, FIFO for MARKET orders, partial fills, and automatic stop-order triggering against a simulated market-price feed.
- **Multi-tenancy** — every entity is tenant-scoped; tenants can override risk limits, order-quantity caps, and the set of tradeable symbols independently of one another.
- **Real-time updates** — per-user WebSocket channels for orders, trades, and notifications; broadcast channels for live prices.
- **Risk controls** — notional cap, position limit, and daily loss limit enforced before every order is accepted.
- **Portfolio & analytics** — open positions with unrealised P&L, realised P&L reports, hourly VWAP/volume snapshots, and intraday volatility metrics.
- **Notifications** — in-app + email notifications on fills, rejections, and stop triggers.
- **Security** — JWT auth with refresh tokens, BCrypt password hashing, rate limiting, account lockout, email verification, and role-based access control (`TRADER` / `ADMIN`).
- **Reliability** — transactional trade execution, optimistic locking on orders, idempotent order submission and Kafka consumption, and a distributed-lock-guarded Redis cache.
- **Observability** — metrics (Prometheus/Grafana), structured JSON logs (Loki), and distributed tracing (Tempo), all correlated by request ID and trace ID.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3 (Java 17), Spring Security, Spring Data JPA |
| Frontend | React, Redux Toolkit (RTK Query), Material UI |
| Database | PostgreSQL |
| Cache | Redis |
| Messaging | Kafka (order/trade/notification/price events) |
| Realtime | WebSocket (STOMP over SockJS) |
| Observability | Prometheus, Grafana, Tempo, Loki, Promtail |
| Testing | JUnit 5 + Mockito, Testcontainers, Jest + React Testing Library, Playwright |

## Prerequisites

- **Java**: JDK 17+
- **Node.js**: for the frontend (`npm install` / `npm start`)
- **Docker**: for PostgreSQL, Kafka, Redis, and the observability stack
- **Maven**: bundled via `./mvnw`, no separate install needed

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/shuvo151dey/toms.git
   cd toms
   ```

2. Start infrastructure — PostgreSQL, Kafka, ZooKeeper, Redis, plus Prometheus/Grafana/Tempo/Loki/Promtail (requires a `.env` file, copy from `.env.example`):
   ```bash
   docker compose up -d
   ```

3. Run the backend (starts on port 8080; all env vars have local defaults in `application.properties`):
   ```bash
   cd backend
   chmod +x mvnw          # first time only
   ./mvnw spring-boot:run
   ```

4. Run the frontend (starts on port 3000, pre-configured to point at `localhost:8080`):
   ```bash
   cd frontend
   npm install
   npm start
   ```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Grafana | http://localhost:3002 (admin/admin) |
| Prometheus | http://localhost:9090 |

## Running Tests

```bash
# Backend unit tests (fast, no Docker needed)
cd backend && ./mvnw test -Dtest=MatchingEngineServiceTest

# Backend integration tests (requires Docker — Testcontainers spins up PostgreSQL + Kafka)
cd backend && ./mvnw test -Dtest=MatchingEngineIntegrationTest -DargLine="-Xmx1024m"

# Frontend component tests
cd frontend && npm test

# E2E tests (requires docker compose, backend, and frontend all running)
cd e2e && npx playwright test --project=chromium --workers=1
```

Run the two backend test classes separately — sharing one forked JVM destabilizes the fork once the integration test's Kafka broker stops. For the full E2E suite, raise the auth rate limit first: `RATE_LIMIT_AUTH=50 ./mvnw spring-boot:run`.

## Free-Tier Hosted Deployment (Render + Vercel)

A minimum-config variant of this app is deployed on entirely free-tier infrastructure, tracked on the `deploy/render-vercel` branch:

- **Backend**: Spring Boot on [Render](https://render.com) (Docker-based web service)
- **Frontend**: React on [Vercel](https://vercel.com)
- **Database**: Render PostgreSQL
- **Cache**: [Upstash](https://upstash.com) Redis (TLS)
- **Kafka**: [Aiven](https://aiven.io) managed Kafka (SASL_SSL)

The app's connection settings were already env-var driven for local dev, so most of this required no code changes — just provisioning managed services and wiring env vars. A handful of fixes were needed to make the app deploy cleanly on a memory-capped free container:

- **CORS**: `SecurityConfig`, `WebConfig`, and `WebSocketConfig` all read `REACT_FRONTEND_URL`, which now accepts a comma-separated list of origins (useful for supporting both a Vercel preview URL and a production domain at once).
- **Faster port binding**: JPA repository bootstrapping is deferred (`spring.data.jpa.repositories.bootstrap-mode=deferred`) and Kafka listeners are started explicitly on `ApplicationReadyEvent` rather than during context refresh, so slow datastore/broker connections no longer delay Tomcat's port bind — this matters because Render's free tier kills a deploy that doesn't bind a port quickly enough.
- **Kafka over SASL_SSL**: `KafkaConfig` hand-builds a `KafkaAdmin` bean from the same `kafka.*` properties used by the producer/consumer factories (Spring Boot otherwise autoconfigures its own `KafkaAdmin` from the unrelated `spring.kafka.*` namespace, which silently defaults to plaintext `localhost:9092` and floods a SASL-only broker with failed handshakes). The CA certificate is supplied as a base64 env var (`KAFKA_SSL_CA_CERT_BASE64`) and decoded with a lenient MIME decoder to tolerate whitespace from dashboard copy/paste. Since managed Kafka providers don't auto-create topics like a local dev broker does, the required topics (`orders`, `trades`, `notifications`, `market-data`) are declared as `NewTopic` beans.
- **Memory footprint**: the JVM heap is capped (`-Xmx400m` via `JAVA_OPTS`) and Kafka listener concurrency / HikariCP pool size are reduced and made configurable, to fit Render's free-tier memory ceiling without getting OOM-killed.
- **Local observability stack dropped**: the Render/Vercel branch removes file-based log rotation and distributed tracing config, since there's no Promtail/Tempo sidecar available on a single free container — logs go to stdout, which Render captures natively.

`main` is untouched and keeps the full local-dev stack (self-hosted Kafka, Redis, Postgres, Prometheus, Grafana, Tempo, Loki via `docker-compose.yml`).

## Observability

Metrics, logs, and traces are correlated through the same request and viewable in one Grafana instance:

- **Metrics**: Spring Boot Actuator exposes `/actuator/health` (public), `/actuator/metrics`, and `/actuator/prometheus` (ADMIN-only), scraped by Prometheus every 15s.
- **Logs**: structured JSON logs, tagged with a per-request correlation ID, shipped to Loki via Promtail.
- **Traces**: Micrometer Tracing reports spans to Tempo, sampled at 100% locally, with trace IDs linked into every log line.
