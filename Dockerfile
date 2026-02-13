# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for tsx)
RUN npm ci

# Copy source code and config files
COPY tsconfig.json ./
COPY src/ ./src/
COPY soul/ ./soul/
COPY skills/ ./skills/

# ---- Runtime Stage ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

# Create data directory for wallet persistence
RUN mkdir -p /app/data

# Create a non-root user for security
RUN addgroup -S mantlency && adduser -S mantlency -G mantlency \
    && chown -R mantlency:mantlency /app

USER mantlency

# Healthcheck: verify the process is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD pgrep -f "tsx" > /dev/null || exit 1

CMD ["npx", "tsx", "src/index.ts"]
