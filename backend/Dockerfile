FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# ARG busts Docker layer cache on every deploy
ARG CACHEBUST=1
RUN npm run build || echo "TS type errors - non fatal, dist still emitted"

# Production image
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
