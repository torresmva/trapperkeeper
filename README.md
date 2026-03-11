# trapperkeeper

Personal work journal, impact log, and quick notes tool. Markdown-first, file-backed, Git-friendly.

Built for tracking accomplishments, meeting notes, decisions, incidents, and project milestones. Everything saves as `.md` files with YAML frontmatter — edit in the browser or with any text editor.

## Stack

- **Server**: Node.js + Express + TypeScript
- **Client**: React 18 + Vite + TypeScript
- **Editor**: CodeMirror 6 with markdown syntax highlighting
- **Storage**: Flat `.md` files with YAML frontmatter (no database)
- **Search**: MiniSearch in-memory full-text search
- **Live reload**: Chokidar file watcher + WebSocket

## Features

**Core**
- 9 entry types: daily, weekly, monthly, meeting, 1:1, incident, decision, project-update, note
- Auto-save with 800ms debounce
- Markdown editor with live split preview, full-screen preview (`Ctrl+P`)
- `/` slash commands for inserting markdown (code blocks, tables, mermaid, math, etc.)
- Wiki-style `[[links]]` with backlinks and hover preview
- Collections system with pinning
- Tags
- Archive/unarchive entries
- Duplicate entries

**Markdown rendering**
- Syntax-highlighted code blocks with line numbers, language labels, copy button
- Mermaid diagram rendering
- KaTeX math rendering
- GFM tables, task lists, strikethrough

**Media**
- Paste images from clipboard into editor
- Drag & drop images
- Audio recording (mic or system audio via Chrome) + audio file upload
- Audio player embedded in notes

**Views**
- Dashboard with git-style activity heatmap, streaks, top tags/collections
- Timeline view (all entries or filtered by collection)
- Weekly digest
- Full-text search
- Export to markdown

**Other**
- Dark/light mode with custom accent colors (7 presets)
- Mobile-responsive with bottom nav
- Print stylesheet (`Ctrl+Shift+P`)
- Keyboard shortcuts (`?` to view all)
- Quick capture (`Ctrl+K`) from anywhere
- Entry templates auto-loaded on creation
- PWA installable
- HTTPS with auto-generated self-signed cert (for audio recording on non-localhost)
- MCP server for Claude Code integration
- External `.md` file editing supported (picked up by file watcher)

## Quick start

### Docker (recommended)

```bash
git clone http://192.168.0.181:8080/home-projects/trapperkeeper.git
cd trapperkeeper
docker compose up --build -d
```

- HTTP: `http://localhost:3001`
- HTTPS: `https://localhost:3443` (accept self-signed cert on first visit)

Use HTTPS if you need audio recording from a non-localhost address.

### Persistent data

Default uses a Docker named volume. To use a bind mount (recommended for Git-backing your notes):

```yaml
# docker-compose.yml
volumes:
  - ./data:/app/data
```

### Dev mode

```bash
npm install
npm run dev
```

Client runs on `:5173`, server on `:3001`. Vite proxies API requests.

## Data structure

```
data/
  journal/
    2025/
      03/
        daily-2025-03-11.md
        weekly-2025-03-w11.md
  notes/
    meeting-standup-2025-03-11.md
  templates/
    daily.md, weekly.md, meeting.md, ...
  assets/
    img-*.png, audio-*.webm
```

Each `.md` file has YAML frontmatter:

```yaml
---
title: "Monday standup"
date: "2025-03-11"
type: meeting
category: notes
tags: [standup, team]
collections: [meetings]
pinnedInCollections: [meetings]
---
```

## MCP server (Claude Code integration)

Exposes 4 tools: `search_entries`, `create_quick_note`, `list_recent_entries`, `read_entry`.

```bash
# Install deps
cd server && npm install

# Add to your Claude Code MCP config
```

```json
{
  "mcpServers": {
    "trapperkeeper": {
      "command": "npx",
      "args": ["tsx", "server/src/mcp.ts"],
      "cwd": "/path/to/trapperkeeper"
    }
  }
}
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Quick capture |
| `Ctrl+P` | Full preview (in editor) |
| `?` | Show all shortcuts |
| `0-6` | Navigate sidebar |
| `/` | Insert markdown (in editor) |
| `Esc` | Close modal/dialog |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `SSL_PORT` | `3443` | HTTPS port |
| `ENABLE_HTTPS` | `true` | Set to `false` to disable |
| `DATA_DIR` | `./data` | Data directory path |
