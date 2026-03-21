# trapperkeeper

personal work journal + impact log. markdown files, no database.

`node` `express` `react` `typescript` `vite` `codemirror` `docker` `websocket`

## deploy

Strongly recommend setting up a persistent data dir, and mounting. See details in docker-compose.yml

Quick deploy:
```bash
mkdir -p /opt/tk-data
curl -sO https://raw.githubusercontent.com/torresmva/trapperkeeper/main/docker-compose.yml
docker compose up -d
```

open http://localhost:3001 — default password: `rocco`

## config

| env | default | |
|-----|---------|---|
| `TK_PASSWORD` | `rocco` | set empty to disable auth |
| `PORT` | `3001` | http port |
| `SSL_PORT` | `3443` | https (auto-generated cert) |

## data

all entries are `.md` files with yaml frontmatter in `/app/data`. mount a host directory for persistence + git backup:

```yaml
# uncomment in docker-compose.yml:
volumes:
  - /opt/tk-data:/app/data
```

## updates

handled in-app via **sys → updates**. the warden container manages restarts automatically.

manual: `docker compose pull && docker compose up -d`

## https

auto-generated self-signed cert on `:3443`. required for audio recording on non-localhost.
