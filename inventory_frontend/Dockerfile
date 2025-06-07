# Build stage
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy all source files
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=/api

# Explicitly set environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Create production environment file to ensure correct API URL
RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.local
RUN echo "NODE_ENV=${NODE_ENV}" >> .env.local

# Build the application with the correct API URL
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set runtime environment
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api

# Health check
HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=2 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 