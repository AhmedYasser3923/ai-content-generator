# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install production deps only
RUN npm ci --omit=dev

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy app source
COPY . .

# Remove dev files if any
RUN rm -rf .env.example tests/ *.test.js

# Ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "app.js"]