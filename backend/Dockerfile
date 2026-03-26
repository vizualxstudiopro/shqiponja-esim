FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN echo "BUILD_ID=20260326-v5" > /app/.build-id
RUN cat routes/webhook.js | head -35 | tail -3
RUN ls -la seeds/ && echo "CSV exists in image"
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
