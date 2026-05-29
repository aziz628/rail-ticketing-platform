# Stage 1: Build with Maven
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
# Cache dependencies
RUN --mount=type=cache,target=/root/.m2 ./mvnw dependency:go-offline
COPY . .
# Build the application
RUN --mount=type=cache,target=/root/.m2 ./mvnw package -DskipTests

# Stage 2: Run with JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the jar from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the application port
EXPOSE 8080
#command that will always be executed when the container starts
ENTRYPOINT ["java", "-jar", "app.jar"]
