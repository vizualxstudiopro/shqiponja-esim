FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
ARG CACHEBUST=4
RUN npm ci --omit=dev
COPY . .
RUN ls -la seeds/ && echo "CSV exists in image"
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
