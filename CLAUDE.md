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
- **Known issue**: the signing key is currently generated randomly on startup (`Keys.secretKeyFor(...)`), meaning all tokens are invalidated on backend restart. Fix: externalize via `JWT_SECRET` env var.
- `JwtAuthenticationFilter` skips processing for paths starting with `/api/v1/auth/` and `/ws/`.
- The frontend (`ApiSlice`) auto-retries with a refreshed token on 401 responses.

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
| `backend/src/.../config/SecurityConfig.java` | Spring Security filter chain, CORS, BCrypt config |
| `backend/src/.../config/WebSocketConfig.java` | STOMP endpoint registration, allowed origins |
| `backend/src/.../service/MatchingEngineService.java` | Core order matching algorithm |
| `backend/src/.../util/JwtTokenUtil.java` | JWT generation and validation |
| `backend/src/.../service/KafkaConsumerService.java` | Bridges Kafka messages to WebSocket |
| `frontend/src/redux/ApiSlice.js` | All RTK Query endpoints + token refresh interceptor |
| `frontend/src/services/WebSocketService.js` | STOMP connection, subscriptions, reconnect logic |
| `backend/src/main/resources/application.properties` | All Spring config with local-dev defaults |

---

## Database

- `spring.jpa.hibernate.ddl-auto=update` — schema is updated on startup, data is preserved across restarts.
- `db-scripts/init.sql` runs once on first PostgreSQL container start to create the role and database.
- Credentials for the DB container come from `.env` (see `.env.example`).
