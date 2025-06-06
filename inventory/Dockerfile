# Use Eclipse Temurin JDK 17 as base image for building
FROM eclipse-temurin:17-jdk AS build

# Set working directory
WORKDIR /app

# Copy gradle files
COPY gradle gradle
COPY build.gradle settings.gradle gradlew ./
COPY gradlew.bat ./

# Make gradlew executable
RUN chmod +x ./gradlew

# Copy source code
COPY src src

# Build the application
RUN ./gradlew clean build -x test

# Runtime stage - Use Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 spring && \
    useradd -r -u 1001 -g spring spring

# Set working directory
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Change ownership to spring user
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"] 