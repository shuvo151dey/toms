# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TOMS (Trading Order Management System) — a multi-tenant trading platform with a Spring Boot backend and React frontend. Core flow: order creation → matching engine → trade execution → Kafka event → WebSocket push → live UI update.

---

## Development Commands

### Prerequisites

Start infrastructure (PostgreSQL, Kafka, Zookeeper, Redis) before running either app:

```bash
# From project root — requires a .env file (copy from .env.example)
docker compose up -d
```

### Backend

```bash
cd backend
chmod +x mvnw          # first time only
./mvnw spring-boot:run # run locally (no sudo needed)
./mvnw clean package   # build JAR (skips tests by default with -DskipTests)
./mvnw test            # run all tests
./mvnw test -Dtest=ClassName#methodName  # run a single test
```

The backend starts on **port 8080**. All env vars have local defaults in `application.properties` so no `.env` is needed for the backend itself.

### Frontend

```bash
cd frontend
npm install
npm start   # dev server on port 3001
npm run build
npm test
```

Environment for local dev is pre-configured in `frontend/.env.development` (points to `localhost:8080`).

---

## Architecture

### Request → Response Flow

```
React (RTK Query) → POST /api/v1/orders
  → JwtAuthenticationFilter (validates Bearer token, extracts tenantId)
  → OrderController (validates, saves to PostgreSQL)
  → KafkaProducerService (publishes to "orders" topic)
  → KafkaConsumerService (consumes, routes via tenantId header)
  → WebSocket /topic/orders/{tenantId}
  → Frontend STOMP subscription → Redux dispatch → UI update
```

### Multi-tenancy

Every entity (`TradeOrder`, `Trade`, `User`) carries a `tenantId` string. All repository queries, matching, WebSocket topics, and Kafka message headers are scoped to this field. Currently hardcoded to `"NSE"` in `AuthController` — the infrastructure is multi-tenant ready but the tenant is not yet user-selectable.

### JWT Auth

- Tokens are generated in `JwtTokenUtil` and carry `username`, `tenantId`, and `roles` claims.
- The signing key is loaded from the `JWT_SECRET_KEY` env var (`Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret))`), so tokens survive backend restarts.
- Refresh tokens are stored in an `httpOnly; Secure` cookie (set by `AuthController`, read by `JwtAuthenticationFilter`). They are never exposed to JavaScript.
- `JwtAuthenticationFilter` skips processing for paths starting with `/api/v1/auth/` and `/ws/`.
- The frontend (`ApiSlice`) auto-retries with a refreshed token on 401 responses.

### Security

- **Rate limiting**: `RateLimitInterceptor` (Bucket4j) caps login attempts at 5/min per IP and order submissions at 20/min per username. Returns HTTP 429 with a JSON body on breach. Registered via `WebMvcConfig`.
- **Account lockout**: `User` tracks `failedLoginAttempts` and `accountLockedUntil`. After 5 consecutive failures the account is locked for 15 minutes. Admins can unlock via `POST /api/v1/auth/unlock/{username}`.
- **Email verification**: New accounts start with `enabled=false`. `AuthController` sends a verification link via `EmailService` (`JavaMailSender`). `GET /api/v1/auth/verify?token=...` activates the account.
- **Idempotency**: `POST /api/v1/orders` accepts an `Idempotency-Key` header. The key and response are stored in Redis (24h TTL via `OrderCacheService`) to prevent duplicate orders on client retries.
- **Kafka**: Broker requires SASL/PLAIN authentication. Credentials are configured via env vars (`KAFKA_SECURITY_PROTOCOL`, `KAFKA_SASL_USERNAME`, `KAFKA_SASL_PASSWORD`) and picked up by `KafkaConfig`. The JAAS config is mounted into the Kafka container via `kafka_jaas.conf`.
- **Role enforcement**: `@EnableMethodSecurity` is active on `SecurityConfig`; `@PreAuthorize` guards admin endpoints. The frontend mirrors this with `ProtectedRoute` (role-gated) and `PrivateRoute` (auth-gated). `/unauthorized` renders a 403 page instead of a blank screen.

### Matching Engine (`MatchingEngineService`)

- Triggered manually via `POST /api/v1/matching/` (admin only) — **not** auto-triggered on order creation.
- Uses `PriorityQueue`: MARKET orders → FIFO (timestamp); LIMIT orders → price-time priority (best price first).
- Partial fills are supported: order status becomes `PARTIALLY_COMPLETED`, quantity decremented.
- Stop orders convert to MARKET only when `POST /api/v1/matching/triggerstop/{symbol}` is called with a market price.
- Allowed symbols are hardcoded in `OrderService`: `["AAPL", "GOOGL", "MSFT"]`. Max quantity per order: 100.

### Caching

`OrderCacheService` wraps a Redis hash. The get-by-ID path in `OrderController` checks Redis before hitting PostgreSQL. Cache is invalidated on update and delete. Configured in `RedisConfig` with Jackson JSON serialization including `JavaTimeModule`.

### Frontend State

- Redux store has four slices: `auth`, `order`, `trade`, `app`.
- All API calls go through RTK Query (`ApiSlice`) — mutations invalidate relevant cache tags automatically.
- WebSocket connection is managed by `WebSocketService` (SockJS + STOMP), with exponential backoff reconnect. It dispatches directly to Redux on message receipt.
- `AppSlice` has `theme: "light"/"dark"` with a `toggleTheme` action, but a MUI `ThemeProvider` is not yet wired up in the app root.

### Role-Based Access

- Two roles: `TRADER` (default on signup) and `ADMIN`.
- Analytics (`/analytics` page) and matching endpoints are ADMIN-only, enforced via `@PreAuthorize` / `ProtectedRoute` in the frontend.
- `ProtectedRoute` wraps role-gated pages; `PrivateRoute` wraps auth-gated pages.

---

## Key Files

| Path | Purpose |
|---|---|
| `backend/src/.../config/SecurityConfig.java` | Spring Security filter chain, CORS, BCrypt config; `@EnableMethodSecurity` |
| `backend/src/.../config/WebSocketConfig.java` | STOMP endpoint registration, allowed origins |
| `backend/src/.../config/KafkaConfig.java` | Kafka producer/consumer factories with SASL security props |
| `backend/src/.../config/WebMvcConfig.java` | Registers `RateLimitInterceptor` on auth and order endpoints |
| `backend/src/.../component/RateLimitInterceptor.java` | Bucket4j token-bucket rate limiting (IP for auth, username for orders) |
| `backend/src/.../service/MatchingEngineService.java` | Core order matching algorithm |
| `backend/src/.../service/EmailService.java` | Sends verification emails via `JavaMailSender` |
| `backend/src/.../service/OrderCacheService.java` | Redis cache for orders + idempotency key storage |
| `backend/src/.../util/JwtTokenUtil.java` | JWT generation and validation (key loaded from env) |
| `backend/src/.../service/KafkaConsumerService.java` | Bridges Kafka messages to WebSocket |
| `frontend/src/redux/ApiSlice.js` | All RTK Query endpoints + token refresh interceptor; sends `Idempotency-Key` |
| `frontend/src/services/WebSocketService.js` | STOMP connection, subscriptions, reconnect logic |
| `frontend/src/services/logger.js` | Dev-only console wrapper (gated by `NODE_ENV`) |
| `backend/src/main/resources/application.properties` | All Spring config with local-dev defaults |
| `kafka_jaas.conf` | JAAS credentials mounted into the Kafka container |

---

## Database

- `spring.jpa.hibernate.ddl-auto=update` — schema is updated on startup, data is preserved across restarts.
- `db-scripts/init.sql` runs once on first PostgreSQL container start to create the role and database.
- Credentials for the DB container come from `.env` (see `.env.example`).

---

## Future Scope

Items are grouped by theme and roughly ordered by impact within each group.

---

### ⚙️ Core Trading Features

| # | Item | What to do |
|---|------|------------|
| T1 | ~~**Auto-trigger matching on order creation**~~ | ~~Call `MatchingEngineService.matchOrders(symbol)` asynchronously (via `@Async` or Kafka event) after every successful order save, instead of requiring a manual admin POST.~~ |
| T2 | ~~**Dynamic symbol catalogue**~~ | ~~Replace the hardcoded `["AAPL", "GOOGL", "MSFT"]` list in `OrderService` and the frontend dropdowns with a `Symbol` entity/table; expose `GET /api/v1/symbols` and populate the dropdowns dynamically.~~ |
| T3 | ~~**Real-time stop order evaluation**~~ | ~~Connect a `MarketDataService` (or a mock price-tick publisher) that periodically evaluates pending STOP orders against current prices instead of requiring `POST /api/v1/matching/triggerstop/{symbol}`.~~ |
| T4 | ~~**Market data feed (simulated or live)**~~ | ~~Add a `MarketDataService` that generates OHLCV tick data (simulated via random walk, or via a free provider like Yahoo Finance / Alpaca). Publish ticks to Kafka; subscribe on the frontend for live price display.~~ |
| T5 | ~~**Position & portfolio tracking**~~ | ~~Add a `Position` entity (user × symbol → net quantity, avg cost). Update it on every trade execution. Expose `GET /api/v1/portfolio` so traders can see current holdings and unrealised P&L.~~ |
| T6 | ~~**Risk controls**~~ | ~~Add a `RiskService` called before order acceptance: position limit per user, notional value cap (price × qty), daily loss limit. Reject orders that breach limits with a clear error code.~~ |
| T7 | **Order book depth view** | Expose `GET /api/v1/orderbook/{symbol}` returning aggregated bid/ask levels; render a depth chart on the frontend so traders can see the book before submitting. |
| T8 | **Configurable order constraints** | Move `MAX_QUANTITY=100` and allowed symbols to application config (or DB), not source code, so they can be changed without a redeploy. |

---

### 📊 Analytics & Reporting

| # | Item | What to do |
|---|------|------------|
| A1 | **P&L reporting** | Calculate realised P&L per user per symbol (FIFO cost basis). Expose via `GET /api/v1/analytics/pnl` and add a P&L breakdown page in the frontend. |
| A2 | **Time-series analytics** | Store VWAP, volume, and trade count in a pre-computed `AnalyticsSnapshot` table (populated by a scheduled job), so `AnalyticsService` returns history rather than recalculating from scratch each call. |
| A3 | **End-of-day summary report** | Scheduled job (`@Scheduled` or Quartz) that generates a daily summary (trades, volume, fills) and optionally emails it to admins. |
| A4 | **Volatility & spread metrics** | Add intraday high/low/volatility to `AnalyticsController`; display on a candlestick chart (e.g., `recharts` or `lightweight-charts`) in the analytics page. |
| A5 | **Analytics caching** | Cache `AnalyticsService` responses in Redis with a short TTL (e.g., 30 s) so repeated admin queries don't hit the DB on every call. |

---

### 🔔 Notifications

| # | Item | What to do |
|---|------|------------|
| N1 | **In-app notification centre** | Add a `Notification` entity; publish events (order filled, order rejected, stop triggered) to it. Show a badge + dropdown in the header; mark as read via API. |
| N2 | **Email alerts** | Integrate `spring-boot-starter-mail`. Send emails on order fill, rejection, and daily summary. Templates via Thymeleaf. |
| N3 | **WebSocket per-user channels** | Currently all messages go to `/topic/orders/{tenantId}`. Add per-user channels `/user/queue/notifications` using `SimpMessagingTemplate.convertAndSendToUser()` to avoid broadcasting sensitive order data to all tenants. |

---

### 🏗️ Reliability & Correctness

| # | Item | What to do |
|---|------|------------|
| R1 | **Wrap trade execution in `@Transactional`** | `MatchingEngineService.executeTrade()` currently has no transaction boundary — a crash mid-execution can leave order state inconsistent. Annotate with `@Transactional(isolation = REPEATABLE_READ)`. |
| R2 | **Optimistic locking on orders** | Add `@Version` to `TradeOrder` to prevent lost-update race conditions when two matching cycles run concurrently on the same order. |
| R3 | **Redis cache coherence** | Use Redisson distributed lock (or Lua CAS) around the read-modify-write cycle in `OrderCacheService` to close the window between DB write and cache invalidation. |
| R4 | **Global exception handler** | Add `@ControllerAdvice GlobalExceptionHandler` with typed exceptions (`OrderNotFoundException`, `InsufficientFundsException`, `SymbolNotAllowedException`) returning structured JSON error bodies, replacing the current ad-hoc `RuntimeException` throws. |
| R5 | **Idempotent Kafka consumer** | `KafkaConsumerService` can process a message more than once on rebalance or retry. Store processed Kafka offsets (or a dedup key) in the DB to make trade creation idempotent. |
| R6 | **Enforce pagination limits** | `OrderController.getOrders()` accepts arbitrary page sizes. Add `@Max(100)` to the size parameter and validate with `@Validated` on the controller. |

---

### 🖥️ Frontend Improvements

| # | Item | What to do |
|---|------|------------|
| F1 | **Wire up dark/light theme** | `AppSlice` already tracks `theme`. Create a MUI `theme` object for each mode and wrap `App.js` in `<ThemeProvider theme={...}>` that reads from Redux state. |
| F2 | **Client-side order form validation** | Add field-level validation to `OrderModal` (symbol required, quantity 1–100, price > 0 for LIMIT orders, stop price required for STOP orders) before hitting the API. Show inline error messages. |
| F3 | **Structured error messages** | Parse backend error codes/messages in `ApiSlice` and surface them as actionable alerts (`"Symbol TSLA is not supported"`) instead of the current generic `"Order creation failed"`. |
| F4 | **User profile & settings page** | Add a `/profile` route showing username, role, tenant, and options to change password. Extend `AuthController` with `PUT /api/v1/auth/password`. |
| F5 | **Dashboard / home page** | Replace the combined order+trade list on Home with a proper dashboard: key metrics cards (open orders, today's trades, P&L), mini chart, recent activity feed. |
| F6 | **Order cancellation UI** | The backend likely supports order updates, but there is no cancel button in the UI. Add a cancel action in `OrderBook` that calls `DELETE /api/v1/orders/{id}`. |
| F7 | **Trade history pagination** | `TradeFeed` loads all trades. Add server-driven pagination with infinite scroll or page controls. |
| F8 | **Session expiry handling** | On tab close / reopen, check token expiry before letting the user in. Prompt re-login instead of letting an expired token accumulate in `localStorage`. |

---

### 🧪 Testing

| # | Item | What to do |
|---|------|------------|
| X1 | **Unit tests for matching engine** | `MatchingEngineService` has complex priority logic and partial-fill edge cases — add JUnit 5 + Mockito tests covering: full fill, partial fill, MARKET vs LIMIT priority, stop order conversion. |
| X2 | **Integration tests with Testcontainers** | Use `@SpringBootTest` + Testcontainers (PostgreSQL, Kafka) to test the full order → match → trade → Kafka path without mocks. |
| X3 | **Frontend component tests** | Add Jest + React Testing Library tests for `OrderModal`, `OrderBook`, `TradeFeed`, and the Redux slices. |
| X4 | **E2E tests** | Add Playwright or Cypress tests for the core trader flow: login → create order → trigger match → see trade in feed. |

---

### 🔭 Observability

| # | Item | What to do |
|---|------|------------|
| O1 | **Spring Boot Actuator** | Enable `/actuator/health`, `/actuator/metrics`, `/actuator/info` and configure readiness/liveness probes for Docker/Kubernetes deployments. |
| O2 | **Structured logging** | Replace plain `System.out`/bare SLF4J with structured JSON logging (Logstash encoder) so logs are queryable in ELK or Loki. Add correlation IDs per request. |
| O3 | **Prometheus + Grafana** | Expose Micrometer metrics via `/actuator/prometheus`; add a Grafana dashboard tracking order throughput, match latency, Kafka consumer lag, cache hit rate. |
| O4 | **Distributed tracing** | Add OpenTelemetry instrumentation (or Zipkin via `spring-cloud-sleuth`) to trace a request from REST → Kafka → WebSocket across services. |
| O5 | **Log rotation & retention** | `logs/toms.log` grows unbounded. Configure `logback-spring.xml` with rolling file appender (size + time based) and a max-history policy. |

---

### 🏢 Multi-tenancy Completion

| # | Item | What to do |
|---|------|------------|
| M1 | **Dynamic tenant selection at login** | Replace hardcoded `tenantId = "NSE"` in `AuthController` with a `tenantId` field in the signup/login request body. Store the chosen tenant in the JWT claim (already read correctly downstream). |
| M2 | **Tenant administration panel** | Add an ADMIN-only page to create and manage tenants (name, allowed symbols, risk limits). Back it with a `Tenant` entity and `TenantRepository`. |
| M3 | **Per-tenant risk configuration** | Allow each tenant to have its own symbol list, position limits, and order size caps, rather than sharing global hardcoded values. |

---

### 🚀 DevOps & Infrastructure

| # | Item | What to do |
|---|------|------------|
| D1 | **Kubernetes manifests** | Add `k8s/` directory with Deployments, Services, ConfigMaps, and HorizontalPodAutoscalers for backend and frontend. |
| D2 | **CI/CD pipeline** | Add a GitHub Actions workflow: test → build Docker image → push to registry → deploy to staging. |
| D3 | **Secrets management** | Move DB password, JWT secret, and Kafka credentials to a secrets manager (Vault, AWS Secrets Manager, or GitHub Actions secrets) rather than `.env` files. |
| D4 | **Database migrations** | Replace `ddl-auto=update` with Flyway or Liquibase managed migrations so schema changes are versioned, reviewable, and reversible. |
| D5 | **OpenAPI / Swagger UI** | Add `springdoc-openapi-starter-webmvc-ui` dependency; annotate controllers — auto-generates interactive API docs at `/swagger-ui.html`. |
| D6 | **Read replica for analytics** | Route `AnalyticsService` queries to a PostgreSQL read replica to prevent heavy analytical queries from impacting the OLTP write path. |
