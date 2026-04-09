FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

# v6 — native Shopline checkout, webhook, reveal page
ARG BUILD_DATE=v6
RUN echo "Build: $BUILD_DATE"
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
