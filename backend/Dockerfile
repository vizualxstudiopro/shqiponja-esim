FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules

# Force cache invalidation - change this value to force rebuild
ARG CACHE_DATE=2026-03-26T15:10:00
RUN echo "Cache bust: ${CACHE_DATE}"

COPY . .
RUN echo "BUILD_ID=20260326-v6" > /app/.build-id
RUN echo "=== VERIFYING webhook.js has async ===" && grep -n "router.post" routes/webhook.js && echo "=== END VERIFY ==="
RUN ls -la seeds/ && echo "CSV exists in image"
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
