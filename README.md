# trapperkeeper

personal work journal, impact log, and quick notes. markdown-first, file-backed, git-friendly.

## deploy

```bash
curl -sO https://raw.githubusercontent.com/torresmva/trapperkeeper/main/docker-compose.yml
```

or create `docker-compose.yml`:

```yaml
services:
  trapperkeeper:
    image: ghcr.io/torresmva/trapperkeeper:latest
    container_name: trapperkeeper
    ports:
      - "3001:3001"
      - "3443:3443"
    volumes:
      - trapperkeeper-data:/app/data
    restart: unless-stopped
    environment:
      - TK_PASSWORD=rocco           # change this, or leave empty to disable auth
      - TK_WARDEN_URL=http://tk-warden:3002

  warden:
    image: ghcr.io/torresmva/trapperkeeper-warden:latest
    container_name: tk-warden
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
    environment:
      - TK_CONTAINER=trapperkeeper
      - TK_HEALTH_URL=http://trapperkeeper:3001/api/update/health

volumes:
  trapperkeeper-data:
    driver: local
```

then:

```bash
docker compose up -d
```

open `http://localhost:3001`. default password is `rocco` — change it via `TK_PASSWORD` in your compose file, or set it empty to disable auth.

## persistent data

by default, data is stored in a docker volume. to use a host directory (recommended — lets you git-back your notes):

```yaml
volumes:
  - ./data:/app/data    # instead of trapperkeeper-data:/app/data
```

## updates

updates are handled in-app. the warden container monitors health and manages restarts. click **sys → updates → apply update** in the UI.

the warden requires docker socket access to manage the trapperkeeper container. if you're on a system that restricts socket access, update manually:

```bash
docker compose pull && docker compose up -d
```

## https

trapperkeeper auto-generates a self-signed SSL cert on first run. access via `https://localhost:3443`. required for audio recording on non-localhost.

## environment

| variable | default | description |
|----------|---------|-------------|
| `TK_PASSWORD` | `rocco` | login password. set empty to disable auth |
| `TK_SECRET` | auto-generated | token signing secret. set for stable sessions across restarts |
| `PORT` | `3001` | http port |
| `SSL_PORT` | `3443` | https port |
| `ENABLE_HTTPS` | `true` | set `false` to disable |

## dev

```bash
npm install
npm run dev
```

client on `:5173`, server on `:3001`. vite proxies api requests.

## data format

everything is `.md` with yaml frontmatter in `data/`. edit with any text editor, sync with git, back up however you want.

```
data/
  journal/2025/03/daily-2025-03-11.md
  notes/meeting-standup.md
  templates/daily.md
  assets/img-*.png
  wiki/page-name.md
```
