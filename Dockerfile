# Multi-stage Docker build for production

# Stage 1: Build frontend
FROM node:18-bullseye-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-bullseye-slim AS backend-builder

WORKDIR /app/backend

# Copy backend package files and local vendor dependencies required for installation
COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY vendor/wkhtmltopdf-installer /app/vendor/wkhtmltopdf-installer
RUN npm ci

# Copy backend source and build
COPY backend/src ./src
RUN npm run build

# Stage 3: Production image
FROM node:18-bullseye-slim AS production

# Install system dependencies for wkhtmltopdf and curl for healthchecks
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        wkhtmltopdf \
        fonts-freefont-ttf \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m nextjs

# Copy backend production files
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy frontend production files
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/next.config.js ./frontend/

# Create necessary directories
RUN mkdir -p /app/data/uploads /app/data/database
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Copy startup script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]