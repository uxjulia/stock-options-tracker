# Stage 1: Build
FROM node:20-alpine AS builder

# Native module build deps (required for better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install all dependencies
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

# Copy source and build
COPY client/ ./client/
COPY server/ ./server/
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server --omit=dev

# Copy built artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production
ENV DB_PATH=/app/data/options.db

CMD ["node", "server/dist/index.js"]
