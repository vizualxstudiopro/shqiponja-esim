FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules

# Cache bust: 2026-04-05
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
