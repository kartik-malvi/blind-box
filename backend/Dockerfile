FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm install typescript ts-node

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
