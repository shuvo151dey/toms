# Trading Order Management System (TOMS)

A robust and scalable application to manage trading orders, built using **Spring Boot** with **PostgreSQL** for data persistence and **Redis** for caching.

## Features
- **CRUD Operations**: Create, Read, Update, and Delete trading orders.
- **Validation**: Ensures correct data using Java Bean Validation.
- **Scalability**: Ready for Redis integration for improved performance.
- **Extendable**: Modular design for adding entities like Trades or Portfolios.

## Technologies Used
- **Backend**: Spring Boot (Java)
- **Database**: PostgreSQL
- **Caching**: Redis (Planned)
- **Build Tool**: Maven

## Prerequisites
- **Java**: JDK 17 or later
- **PostgreSQL**: Version 12+
- **Redis**: Version 7.4 (optional)
- **Maven**: Version 3.6 or later

## Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/shuvo151dey/toms.git
   cd toms
   ```

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
