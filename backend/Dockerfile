FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

# v4 — HMAC-SHA256 sign, body={code} only
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
