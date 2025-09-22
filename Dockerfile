# Multi-stage Docker build for the unified Next.js application

FROM node:18-bullseye-slim AS deps

WORKDIR /app

# Install build tooling for native dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY frontend/package*.json ./
RUN npm ci

FROM node:18-bullseye-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./

RUN npm run build

FROM node:18-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

RUN npm prune --omit=dev

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/data/uploads /app/data/database \
  && chown -R nextjs:nodejs /app

COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
