# Use Eclipse Temurin JDK 17 as base image for building
FROM eclipse-temurin:17-jdk AS build

# Set working directory
WORKDIR /app

# Copy gradle wrapper and build files first for better caching
COPY gradle gradle
COPY build.gradle settings.gradle gradlew ./
COPY gradlew.bat ./

# Make gradlew executable
RUN chmod +x ./gradlew

# Download dependencies (this layer will be cached)
RUN ./gradlew dependencies --no-daemon

# Copy source code
COPY src src

# Build the application with parallel builds and daemon disabled for container
RUN ./gradlew clean build -x test --no-daemon --parallel

# Runtime stage - Use Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre

# Install wget for health checks (lighter than curl)
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

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

# Health check with faster interval
HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=2 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application with optimized JVM settings
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"] 