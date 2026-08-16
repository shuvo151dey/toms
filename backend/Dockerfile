# Stage 1: Build the JAR
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /app

ARG REACT_FRONTEND_URL
ENV REACT_FRONTEND_URL=${REACT_FRONTEND_URL}

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the runnable container
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/toms-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
# Explicit heap cap: free-tier hosts (Render et al.) can OOM-kill the container
# (exit 137, no JVM error logged — it's the OS, not the JVM) with an uncapped
# heap. -XX:+UseContainerSupport already reads the cgroup limit by default on
# modern JDKs, but a hard -Xmx is more predictable than relying on the JVM's
# fraction-of-available-memory heuristic. Override via JAVA_OPTS if the host
# has more headroom (e.g. a paid tier).
ENV JAVA_OPTS="-Xmx400m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
