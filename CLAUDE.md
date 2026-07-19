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
npm start   # dev server on port 3000
npm run build
npm test
```

Environment for local dev is pre-configured in `frontend/.env.development` (points to `localhost:8080`).

### Running Tests

```bash
# Backend unit tests (fast, no Docker needed)
cd backend && ./mvnw test -Dtest=MatchingEngineServiceTest

# Backend integration tests (requires Docker running — spins up PostgreSQL + Kafka containers)
cd backend && ./mvnw test -Dtest=MatchingEngineIntegrationTest -DargLine="-Xmx1024m"

# Frontend component tests (Jest + React Testing Library)
cd frontend && npm test

# E2E tests (requires docker compose, backend, and frontend all running)
cd e2e && npx playwright test --project=chromium --workers=1
```

Run the two backend test classes **separately** — sharing one forked JVM makes the Kafka listeners from the integration context destabilize the fork after the test broker stops.

For the full E2E suite, start the backend with a raised auth rate limit (`RATE_LIMIT_AUTH=50 ./mvnw spring-boot:run`) — the suite performs more logins per minute than the default limit (5/min per IP) allows.

---

## Architecture

### Request → Response Flow

```
React (RTK Query) → POST /api/v1/orders
  → JwtAuthenticationFilter (validates Bearer token, extracts tenantId)
  → OrderController (validates, saves to PostgreSQL)
  → KafkaProducerService (publishes to "orders" topic)
  → KafkaConsumerService (consumes, routes to user)
  → WebSocket /user/queue/orders  (per-user, private)
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

- Auto-triggered via `@Async` (`asyncMatchOrdersForSymbol`) after every successful order save — no manual admin trigger needed.
- Admin can still manually trigger all symbols via `POST /api/v1/matching/` (runs synchronously).
- Uses `PriorityQueue`: MARKET orders → FIFO (timestamp); LIMIT orders → price-time priority (best price first).
- Partial fills are supported: order status becomes `PARTIALLY_COMPLETED`, quantity decremented.
- Stop orders are evaluated automatically every 30s by `StopOrderScheduler` against simulated market prices.
- Allowed symbols are loaded from the `Symbol` entity/table (seeded with AAPL, GOOGL, MSFT). Managed via `GET /api/v1/symbols`.
- Max quantity per order is configurable via `order.constraints.max-quantity` in `application.properties` (default: 100).

### Market Data

- `MarketDataService` simulates prices via a random walk (±2% per tick), seeded at $100 per symbol.
- `StopOrderScheduler` runs every 30s: calls `getPrice()` per symbol, publishes to the `market-data` Kafka topic, then evaluates stop orders.
- `KafkaConsumerService` routes price updates to `/topic/prices/{tenantId}/{ticker}` — one WebSocket channel per symbol.
- Frontend subscribes per ticker in `WebSocketService`, dispatches to `PriceSlice`, and displays live prices in the `PriceTicker` component.
- `getLastPrice()` is a read-only variant used by `PortfolioController` and `RiskService` to avoid advancing the random walk on reads.

### Position & Portfolio

- `Position` entity tracks `(username, symbol, tenantId) → netQuantity, avgCost` (weighted average updated on every buy).
- Updated inside `MatchingEngineService.executeTrade()` for both the buyer and seller on every trade.
- `GET /api/v1/portfolio` returns open positions with unrealised P&L against last simulated price.
- `GET /api/v1/analytics/pnl` returns total and per-symbol realised P&L (`totalSellAmount - totalBuyAmount` per symbol).

### Risk Controls (`RiskService`)

Called before every order save in `OrderController`, after `OrderService.validateOrder()`. Three checks:
- **Notional cap**: `price × quantity` must not exceed `risk.limits.max-notional` (default $50,000).
- **Position limit**: BUY orders may not push a user's holdings past `risk.limits.max-position` (default 500 shares per symbol).
- **Daily loss limit**: Unrealised loss across all open positions must not exceed `risk.limits.daily-loss-limit` (default $5,000).

All limits are configurable in `application.properties` with Spring env-var override support.

### Order Book Depth

- `GET /api/v1/orderbook/{symbol}` returns aggregated bid and ask levels (price → total quantity) for PENDING and PARTIALLY_COMPLETED orders.
- `OrderBookDepth` component on the frontend polls every 10s with a symbol selector dropdown.

### Analytics

- **P&L**: `GET /api/v1/analytics/pnl` computes realised P&L per user — `totalSellAmount - totalBuyAmount` overall and per symbol. Displayed in `PnlReport` on the home page.
- **Time-series snapshots**: `AnalyticsSnapshotScheduler` runs hourly (`@Scheduled(cron = "0 0 * * * *")`), computes VWAP/volume/trade count per symbol from the last hour's trades, and saves an `AnalyticsSnapshot` row. `GET /api/v1/analytics/snapshots?symbol=` returns history for charting in `AnalyticsChart` (recharts dual-axis line chart).
- **Volatility metrics**: `GET /api/v1/analytics/volatility?symbol=` returns intraday open/high/low/close, spread, and standard deviation of prices. Displayed in `VolatilityMetrics` with a recharts bar chart.
- **Daily report**: `DailyReportScheduler` runs at 6pm daily, builds a plain-text per-symbol summary (trades, volume, VWAP), and emails it to all `ADMIN` users via `EmailService`.
- `AnalyticsService` responses for trade and order analytics are cached via `@Cacheable` with a 5-minute Redis TTL. P&L and volatility are not cached (user-specific / real-time).

### Notifications

- **Entity & flow**: `Notification` entity stores per-user in-app notifications with a `NotificationType` enum (`ORDER_FILLED`, `ORDER_REJECTED`, `STOP_TRIGGERED`) and a `read` flag.
- **Kafka-driven**: event sources (`MatchingEngineService.executeTrade()`, `OrderController` risk rejection, `MatchingEngineService.triggerStopOrders()`) call `KafkaProducerService.sendNotification()` with `username`, `tenantId`, `type`, and `message` as headers. `KafkaConsumerService.consumeNotification()` saves to DB via `NotificationService`, sends an HTML email via `EmailService`, and pushes a real-time WebSocket message to `/user/queue/notifications`.
- **Email templates**: Thymeleaf HTML templates in `src/main/resources/templates/email/` (`order-filled.html`, `order-rejected.html`, `stop-triggered.html`). `EmailService.sendHtmlEmail()` uses `SpringTemplateEngine` + `MimeMessageHelper`.
- **API**: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PUT /api/v1/notifications/{id}/read`, `PUT /api/v1/notifications/read-all`.
- **Frontend**: `NotificationBell` component in the app bar — badge with unread count, popover dropdown with type-coloured chips, polls every 30s and also receives real-time pushes via WebSocket.

### WebSocket (Per-User Channels)

- Orders and trades are routed to private per-user destinations (`/user/queue/orders`, `/user/queue/trades`) via `SimpMessagingTemplate.convertAndSendToUser()` — users only see their own data.
- Notifications are pushed to `/user/queue/notifications` in real-time.
- Market prices remain on broadcast channels `/topic/prices/{tenantId}/{ticker}` (not sensitive).
- `WebSocketAuthInterceptor` (`ChannelInterceptor`) reads the JWT from the STOMP CONNECT frame, validates it via `JwtTokenUtil`, and sets the user principal — enabling Spring to route per-user messages correctly. Registered in `WebSocketConfig.configureClientInboundChannel()`.
- Frontend sends `Authorization: Bearer <token>` in the STOMP CONNECT headers.

### Reliability & Correctness

- **Transactional trade execution**: `TradeExecutorService.executeTrade()` is annotated `@Transactional(isolation = REPEATABLE_READ)` — all five DB writes (two order updates, one trade record, two position updates) are atomic. Extracted from `MatchingEngineService` into its own `@Service` bean so Spring AOP proxying applies correctly.
- **Optimistic locking**: `TradeOrder` carries a `@Version Long version` field. Hibernate appends `WHERE version = ?` to every UPDATE, causing a `OptimisticLockException` on concurrent modifications rather than silently overwriting. `TradeExecutorService.updateOrderStatus()` uses `saveAndFlush` and copies the incremented version back onto the in-memory object, since the matching engine reuses the same instance across multiple partial fills.
- **Redis cache coherence**: `OrderCacheService.getOrLoad()` uses a `SETNX` distributed lock (`opsForValue().setIfAbsent()`) with a 10s TTL around the DB-read → cache-write cycle. `invalidate()` acquires the same lock before deleting. Prevents the read-modify-write race between concurrent requests.
- **Global exception handler**: `GlobalExceptionHandler` (`@RestControllerAdvice`) maps typed exceptions to structured JSON responses — `SymbolNotAllowedException` → 400, `RiskLimitException` → 400, `OrderNotFoundException` → 404, `OrderNotModifiableException` → 400, `OrderConstraintException` → 400, `ConstraintViolationException` → 400.
- **Idempotent Kafka consumer**: `KafkaConsumerService` deduplicates messages using a `ProcessedKafkaMessage` table keyed on `(topic, partition, kafka_offset)` with a DB-level unique constraint. All three listeners (`consumeOrder`, `consumeTrade`, `consumeNotification`) check before processing.
- **Pagination limits**: `OrderController.getOrders()` enforces `@Max(100)` on the `size` parameter via `@Validated` on the controller class.

### Testing

Four layers, from fastest to most realistic (run commands are under Development Commands → Running Tests):

- **Unit tests** (`backend/src/test/.../service/MatchingEngineServiceTest.java`): JUnit 5 + Mockito, 9 tests covering full fill, partial fills, MARKET-before-LIMIT priority, LIMIT price criteria, and stop-order triggering. The mocked `TradeExecutorService` is stubbed with a `doAnswer` that decrements order quantities — without this the matching loop never terminates, because the engine relies on `executeTrade`'s side effect for progress. Orders get explicit distinct timestamps since `@CreationTimestamp` only fires on DB save.
- **Integration tests** (`backend/src/test/.../integrations/MatchingEngineIntegrationTest.java`): `@SpringBootTest` + Testcontainers (PostgreSQL 17, Kafka). `@DynamicPropertySource` points Spring at the containers (`kafka.security.protocol=PLAINTEXT` — the test broker has no SASL), so tests never touch the dev database. `@BeforeEach` wipes trades then orders. Covers the full order → match → trade → position flow, partial-fill statuses, stop-order conversion, engine re-run idempotency, and multi-order matching.
- **Frontend component tests** (`frontend/src/components/*.test.js`): Jest + React Testing Library with `redux-mock-store` and mocked `fetch`. Cover OrderBook cancel-button gating/confirmation and TradeFeed pagination. API slices themselves are deliberately untested — that's RTK Query's own machinery; the components' use of them is what's asserted.
- **E2E tests** (`e2e/tests/*.spec.js`): Playwright against the running stack (`baseURL` http://localhost:3000). Six specs: signup, login, order creation, form validation, cancellation (handles the native `window.confirm` via a dialog handler), and a two-browser-context buyer/seller flow that asserts a matched trade arrives over WebSocket. Signups use unique usernames per run; the cancel spec places a LIMIT order priced away from the market so it stays cancellable. MUI selects are driven by click-then-option (they are not native `<select>` elements), and form fields are scoped to the modal because the Home page has its own Symbol selector.

macOS note: Testcontainers needs `~/.testcontainers.properties` pointing `docker.host` at the Docker Desktop socket, and `~/.docker-java.properties` with `api.version=1.44` (Docker 29+ rejects the client's default API version).

### Caching

- `OrderCacheService` wraps a Redis hash. The get-by-ID path in `OrderController` checks Redis before hitting PostgreSQL. Cache is invalidated on update and delete.
- `AnalyticsService` trade/order analytics methods are cached via `@Cacheable` with a 5-minute Redis TTL (`spring.cache.type=redis`). `@EnableCaching` is on `SecurityConfig`.
- Configured in `RedisConfig` with Jackson JSON serialization including `JavaTimeModule`.

### Frontend State

- Redux store has five slices: `auth`, `order`, `trade`, `app`, `price`.
- All API calls go through RTK Query (`ApiSlice`) — mutations invalidate relevant cache tags automatically.
- WebSocket connection is managed by `WebSocketService` (SockJS + STOMP), with exponential backoff reconnect. Subscribes to per-user order/trade/notification channels and per-ticker price broadcast channels. Dispatches directly to Redux on message receipt.
- `AppSlice` has `theme: "light"/"dark"` with a `toggleTheme` action. A MUI `ThemeProvider` in `App.js` reads from Redux state and applies `lightTheme`/`darkTheme` defined in `theme.js`.
- **Session persistence**: `redux-persist` persists only the `auth` slice to `localStorage`. On tab reopen, `PrivateRoute` checks both `isAuthenticated` and `expiryTime > Date.now()` before granting access — expired tokens are rejected immediately without a round-trip. `App.js` sets two timers on mount: a warning alert 10 minutes before expiry and a logout dispatch at expiry; both are cleared on unmount to prevent leaks.

### Role-Based Access

- Two roles: `TRADER` (default on signup) and `ADMIN`.
- Analytics (`/analytics` page) and matching endpoints are ADMIN-only, enforced via `@PreAuthorize` / `ProtectedRoute` in the frontend.
- `ProtectedRoute` wraps role-gated pages; `PrivateRoute` wraps auth-gated pages.

---

## Key Files

| Path | Purpose |
|---|---|
| `backend/src/.../config/SecurityConfig.java` | Spring Security filter chain, CORS, BCrypt; `@EnableMethodSecurity`, `@EnableAsync`, `@EnableScheduling`, `@EnableCaching` |
| `backend/src/.../config/WebSocketConfig.java` | STOMP endpoint registration; enables `/queue` broker, `/user` destination prefix; registers `WebSocketAuthInterceptor` |
| `backend/src/.../config/KafkaConfig.java` | Kafka producer/consumer factories with SASL security props |
| `backend/src/.../config/WebMvcConfig.java` | Registers `RateLimitInterceptor` on auth and order endpoints |
| `backend/src/.../component/RateLimitInterceptor.java` | Bucket4j token-bucket rate limiting (IP for auth, username for orders) |
| `backend/src/.../component/StopOrderScheduler.java` | `@Scheduled` job — evaluates stop orders and publishes price ticks every 30s |
| `backend/src/.../component/SymbolSeed.java` | `ApplicationRunner` — seeds AAPL, GOOGL, MSFT into Symbol table on first startup |
| `backend/src/.../component/WebSocketAuthInterceptor.java` | `ChannelInterceptor` — reads JWT from STOMP CONNECT frame, sets user principal for per-user routing |
| `backend/src/.../component/AnalyticsSnapshotScheduler.java` | Hourly job — computes VWAP/volume/count per symbol and saves `AnalyticsSnapshot` rows |
| `backend/src/.../component/DailyReportScheduler.java` | Daily 6pm job — builds trade summary and emails all ADMIN users |
| `backend/src/.../service/MatchingEngineService.java` | Core order matching algorithm; `@Async` wrapper for post-order-save auto-trigger |
| `backend/src/.../service/MarketDataService.java` | Simulated price feed via random walk; `getPrice()` advances tick, `getLastPrice()` is read-only |
| `backend/src/.../service/RiskService.java` | Pre-save risk checks: notional cap, position limit, daily loss limit (all configurable) |
| `backend/src/.../service/AnalyticsService.java` | P&L, trade/order analytics, volatility metrics; trade/order responses cached via `@Cacheable` |
| `backend/src/.../service/NotificationService.java` | Saves `Notification` entities; `markRead` and `markAllRead` operations |
| `backend/src/.../service/EmailService.java` | `sendVerificationEmail`, `sendEmail` (plain text), `sendHtmlEmail` (Thymeleaf + MimeMessage) |
| `backend/src/.../service/TradeExecutorService.java` | Atomic trade execution: updates order quantities/statuses, records `Trade`, updates positions — all in one `@Transactional(REPEATABLE_READ)` boundary |
| `backend/src/.../service/OrderCacheService.java` | Redis cache for orders + idempotency key storage; `getOrLoad()` and `invalidate()` use SETNX distributed lock for cache coherence |
| `backend/src/.../service/KafkaConsumerService.java` | Routes Kafka messages: orders/trades to per-user WebSocket queues, prices to broadcast topics, notifications to DB + email + WebSocket push; deduplicates via `ProcessedKafkaMessage` |
| `backend/src/.../exception/GlobalExceptionHandler.java` | `@RestControllerAdvice` — maps typed exceptions to structured JSON error responses |
| `backend/src/.../entity/ProcessedKafkaMessage.java` | Dedup table for Kafka consumer idempotency; unique constraint on `(topic, partition, kafka_offset)` |
| `backend/src/.../controller/AnalyticsController.java` | `/analytics/pnl`, `/analytics/snapshots`, `/analytics/volatility`, `/analytics/trades`, `/analytics/orders` |
| `backend/src/.../controller/NotificationController.java` | `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all` |
| `backend/src/.../controller/OrderBookController.java` | `GET /api/v1/orderbook/{symbol}` — aggregated bid/ask depth levels |
| `backend/src/.../controller/PortfolioController.java` | `GET /api/v1/portfolio` — open positions with unrealised P&L |
| `backend/src/.../controller/SymbolController.java` | `GET /api/v1/symbols` — public symbol list (permit-all) |
| `backend/src/.../entity/AnalyticsSnapshot.java` | Hourly VWAP/volume/trade count snapshot per symbol |
| `backend/src/.../entity/Notification.java` | Per-user notification with `NotificationType`, `read` flag, `createdAt` |
| `backend/src/.../entity/Position.java` | Tracks per-user per-symbol netQuantity and avgCost |
| `backend/src/.../repository/SnapshotRepository.java` | `findBySymbolAndTenantIdOrderByTimestampAsc` for chart history |
| `backend/src/.../repository/NotificationRepository.java` | `findByUsernameAndTenantIdOrderByCreatedAtDesc`, `countByUsernameAndTenantIdAndReadFalse` |
| `backend/src/.../repository/PositionRepository.java` | Queries by username + symbol + tenantId |
| `backend/src/.../util/JwtTokenUtil.java` | JWT generation and validation (key loaded from env) |
| `backend/src/main/resources/templates/email/` | Thymeleaf HTML templates: `order-filled.html`, `order-rejected.html`, `stop-triggered.html` |
| `backend/src/test/.../service/MatchingEngineServiceTest.java` | Unit tests: matching priority, partial fills, stop triggers (Mockito, stubbed executeTrade) |
| `backend/src/test/.../integrations/MatchingEngineIntegrationTest.java` | Integration tests: full order→trade flow on Testcontainers PostgreSQL + Kafka |
| `e2e/tests/` | Playwright E2E specs: auth, order create/validate/cancel, two-user trade match |
| `frontend/src/redux/ApiSlice.js` | All RTK Query endpoints + token refresh interceptor; sends `Idempotency-Key` |
| `frontend/src/redux/PriceSlice.js` | Redux slice for live price map `{ ticker → price }` |
| `frontend/src/services/WebSocketService.js` | STOMP connection; sends JWT in CONNECT headers; per-user order/trade/notification queues + broadcast price topics |
| `frontend/src/services/logger.js` | Dev-only console wrapper (gated by `NODE_ENV`) |
| `frontend/src/components/PriceTicker.js` | Live price chips updated via WebSocket |
| `frontend/src/components/OrderBookDepth.js` | Bid/ask depth table with symbol selector, polls every 10s |
| `frontend/src/components/PnlReport.js` | Realised P&L summary — overall and per-symbol breakdown |
| `frontend/src/components/AnalyticsChart.js` | Dual-axis recharts line chart of hourly VWAP and volume from snapshots |
| `frontend/src/components/VolatilityMetrics.js` | Intraday OHLC stats + recharts bar chart; polls every 30s |
| `frontend/src/components/NotificationBell.js` | AppBar bell icon with unread badge, popover dropdown, mark-read actions |
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

### 🖥️ Frontend Improvements

| # | Item | What to do |
|---|------|------------|
| F1 | ~~**Wire up dark/light theme**~~ | ~~`AppSlice` already tracks `theme`. Create a MUI `theme` object for each mode and wrap `App.js` in `<ThemeProvider theme={...}>` that reads from Redux state.~~ |
| F2 | ~~**Client-side order form validation**~~ | ~~Add field-level validation to `OrderModal` (symbol required, quantity 1–100, price > 0 for LIMIT orders, stop price required for STOP orders) before hitting the API. Show inline error messages.~~ |
| F3 | ~~**Structured error messages**~~ | ~~Parse backend error codes/messages in `ApiSlice` and surface them as actionable alerts (`"Symbol TSLA is not supported"`) instead of the current generic `"Order creation failed"`.~~ |
| F4 | ~~**User profile & settings page**~~ | ~~Add a `/profile` route showing username, role, tenant, and options to change password. Extend `AuthController` with `PUT /api/v1/auth/password`.~~ |
| F5 | ~~**Dashboard / home page**~~ | ~~Replace the combined order+trade list on Home with a proper dashboard: key metrics cards (open orders, today's trades, P&L), mini chart, recent activity feed.~~ |
| F6 | ~~**Order cancellation UI**~~ | ~~The backend likely supports order updates, but there is no cancel button in the UI. Add a cancel action in `OrderBook` that calls `DELETE /api/v1/orders/{id}`.~~ |
| F7 | ~~**Trade history pagination**~~ | ~~`TradeFeed` loads all trades. Add server-driven pagination with infinite scroll or page controls.~~ |
| F8 | ~~**Session expiry handling**~~ | ~~On tab close / reopen, check token expiry before letting the user in. Prompt re-login instead of letting an expired token accumulate in `localStorage`.~~ |

---

### 🧪 Testing

| # | Item | What to do |
|---|------|------------|
| X1 | ~~**Unit tests for matching engine**~~ | ~~`MatchingEngineService` has complex priority logic and partial-fill edge cases — add JUnit 5 + Mockito tests covering: full fill, partial fill, MARKET vs LIMIT priority, stop order conversion.~~ |
| X2 | ~~**Integration tests with Testcontainers**~~ | ~~Use `@SpringBootTest` + Testcontainers (PostgreSQL, Kafka) to test the full order → match → trade → Kafka path without mocks.~~ |
| X3 | ~~**Frontend component tests**~~ | ~~Add Jest + React Testing Library tests for `OrderModal`, `OrderBook`, `TradeFeed`, and the Redux slices.~~ |
| X4 | ~~**E2E tests**~~ | ~~Add Playwright or Cypress tests for the core trader flow: login → create order → trigger match → see trade in feed.~~ |

---

### 🔭 Observability

| # | Item | What to do |
|---|------|------------|
| O1 | ~~**Spring Boot Actuator**~~ | ~~Enable `/actuator/health`, `/actuator/metrics`, `/actuator/info` and configure readiness/liveness probes for Docker/Kubernetes deployments.~~ |
| O2 | ~~**Structured logging**~~ | ~~Replace plain `System.out`/bare SLF4J with structured JSON logging (Logstash encoder) so logs are queryable in ELK or Loki. Add correlation IDs per request.~~ |
| O3 | **Prometheus + Grafana** | Expose Micrometer metrics via `/actuator/prometheus`; add a Grafana dashboard tracking order throughput, match latency, Kafka consumer lag, cache hit rate. |
| O4 | **Distributed tracing** | Add OpenTelemetry instrumentation (or Zipkin via `spring-cloud-sleuth`) to trace a request from REST → Kafka → WebSocket across services. |
| O5 | ~~**Log rotation & retention**~~ | ~~`logs/toms.log` grows unbounded. Configure `logback-spring.xml` with rolling file appender (size + time based) and a max-history policy.~~ |

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
