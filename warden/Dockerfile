FROM node:18-alpine
RUN apk add --no-cache docker-cli docker-cli-compose curl wget
WORKDIR /app
COPY warden.js .
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1
CMD ["node", "warden.js"]
