# Stage 1: Build the JAR
FROM maven:3.9.9-openjdk-17-slim AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the runnable container
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=builder /app/target/toms-application.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
