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

# Version info — pass at build time
ARG TK_VERSION=dev
ARG TK_COMMIT=unknown
ARG TK_BRANCH=main

# Install tsx for running TypeScript directly + openssl for self-signed certs + docker CLI for self-update
RUN apk add --no-cache openssl curl && npm install -g tsx

COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/server ./server
COPY --from=server-build /app/package.json ./
COPY --from=client-build /app/client/dist ./client/dist

# Bake version info into the image
RUN echo "{\"version\":\"${TK_VERSION}\",\"commit\":\"${TK_COMMIT}\",\"buildDate\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"branch\":\"${TK_BRANCH}\"}" > /app/VERSION.json

# Data directory — mount your persistent volume here
RUN mkdir -p /app/data/journal /app/data/notes /app/data/templates /app/data/assets
VOLUME ["/app/data"]

# Default templates — copied to data/templates/ on first run if empty
COPY data/templates/ /app/default-templates/

# Default reference notes — seeded to data/notes/references/ on first run
COPY default-references/ /app/default-references/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:3001/api/update/health || exit 1

CMD ["tsx", "server/src/index.ts"]
