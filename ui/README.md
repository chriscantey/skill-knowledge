# Knowledge Skill — Web UI

Optional browser-based interface for the Knowledge skill. Gives you search, filtering, and an optional markdown editor for your knowledge entries.

## What's Here

```
ui/
  public/
    knowledge/index.html  — Knowledge base browser (search + view entries)
    editor/index.html     — Markdown editor for editing entries in the browser
  server.ts               — Minimal Bun server (knowledge API + static files)
  docker-compose.yml      — Standalone Docker setup (mounts ./public)
  Dockerfile              — Container for the server
  sample-data/            — Demo data to start with
```

## Installation Options

### Option 1: PAI Companion (Recommended)

If you have [PAI Companion](https://github.com/chriscantey/pai-companion) running, the knowledge API is already built into the portal server. Just copy the UI pages:

```bash
mkdir -p ~/portal/knowledge/
cp public/knowledge/index.html ~/portal/knowledge/index.html

# Optional editor
mkdir -p ~/portal/editor/
cp public/editor/index.html ~/portal/editor/index.html
```

Access at `http://[your-server]:9400/knowledge/`

### Option 2: Standalone Docker

Requires Docker and Bun installed. Runs on port 9450 (configurable in `docker-compose.yml`).

```bash
docker compose up -d
```

Access at `http://[your-server]:9450/`

Data is served from `~/data/knowledge/` on your host.

## Sample Data

The `sample-data/` directory contains demo entries. To use them:

```bash
# Copy to your knowledge directory to try it out
cp -r sample-data/* ~/data/knowledge/
```

Or just use the skill normally — your assistant will build the index and entries from scratch as you store things.

## Notes

The UI pages use Google Fonts (Inter, JetBrains Mono) loaded via CDN. If you're in an air-gapped environment, replace the font `<link>` tags with local font files or a system font fallback.

This is based on my personal setup. The knowledge base API path is `/api/knowledge` and expects the data format described in the main README. If you've changed the data directory or index format, you may need to adjust `server.ts`.
