FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

# v5 — forced rebuild, manual ScriptTag route added
ARG BUILD_DATE
RUN echo "Build: $BUILD_DATE"
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
