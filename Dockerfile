# Multi-stage Dockerfile for TeamCRM Spring Boot (Java 21) at Root Level
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Lightweight JRE 21 Runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/teamcrm-backend-1.0.0.jar app.jar

EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]
