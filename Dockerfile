# Build stage — client
FROM node:18-alpine AS client-build
WORKDIR /app
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install
COPY client/ ./client/
RUN npm run build -w client

# Build stage — server
FROM node:18-alpine AS server-build
WORKDIR /app
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install --omit=dev
COPY server/ ./server/

# Runtime
FROM node:18-alpine
WORKDIR /app

# Install tsx for running TypeScript directly + openssl for self-signed certs
RUN apk add --no-cache openssl && npm install -g tsx

COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/server ./server
COPY --from=server-build /app/package.json ./
COPY --from=client-build /app/client/dist ./client/dist

# Data directory — mount your persistent volume here
RUN mkdir -p /app/data/journal /app/data/notes /app/data/templates /app/data/assets
VOLUME ["/app/data"]

# Copy default templates
COPY data/templates/ /app/data/templates/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["tsx", "server/src/index.ts"]
