# trapperkeeper

personal work journal + impact log. markdown files, no database.

`node` `express` `react` `typescript` `vite` `codemirror` `docker` `websocket`

## quick start

```bash
docker run -d --name trapperkeeper -p 3001:3001 \
  -v trapperkeeper-data:/app/data \
  --restart unless-stopped \
  ghcr.io/torresmva/trapperkeeper:latest
```

open http://localhost:3001 — password: `rocco`

## compose (with auto-updates)

```bash
curl -sO https://raw.githubusercontent.com/torresmva/trapperkeeper/main/docker-compose.yml
docker compose up -d
```

## config

| env | default | |
|-----|---------|---|
| `TK_PASSWORD` | `rocco` | set empty to disable auth |
| `PORT` | `3001` | http port |
| `SSL_PORT` | `3443` | https (auto-generated cert) |

data lives in `/app/data` — mount a volume or bind to keep it.
