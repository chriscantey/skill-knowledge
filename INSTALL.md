# Knowledge Skill: Setup Instructions

> **For AI Assistants.** Follow these phases to install the Knowledge skill. Each phase is independently verifiable. If interrupted, resume from any phase.

**Prerequisites:**
- Claude Code installed and working
- A `~/.claude/skills/` directory exists (standard Claude Code setup)

---

### Phase 1: Check Environment

Verify the Claude Code skills directory exists.

**Steps:**

1. Check for the skills directory:
   ```bash
   test -d ~/.claude/skills/ && echo "PASS" || echo "FAIL: ~/.claude/skills/ not found"
   ```

2. If the directory doesn't exist, tell the user:
   > The `~/.claude/skills/` directory is missing. This is created automatically by Claude Code during setup. Make sure Claude Code is installed before continuing.

**Verification:**
```bash
test -d ~/.claude/skills/ && echo "PASS" || echo "FAIL"
```

---

### Phase 2: Copy Skill Folder

Copy the Knowledge skill into the Claude Code skills directory.

**Steps:**

1. Copy the `Knowledge/` folder:
   ```bash
   cp -r Knowledge/ ~/.claude/skills/Knowledge/
   ```

2. Verify:
   ```bash
   test -f ~/.claude/skills/Knowledge/SKILL.md && echo "PASS" || echo "FAIL"
   ```

**Verification:**
```bash
test -f ~/.claude/skills/Knowledge/SKILL.md && \
test -f ~/.claude/skills/Knowledge/Workflows/Learn.md && \
test -f ~/.claude/skills/Knowledge/Workflows/Recall.md && \
test -f ~/.claude/skills/Knowledge/Workflows/Browse.md && \
echo "PASS" || echo "FAIL: skill files missing"
```

---

### Phase 3: Create Knowledge Base Data Directory

Set up the directory structure where knowledge entries are stored.

**Steps:**

1. Create the directory layout:
   ```bash
   mkdir -p ~/data/knowledge/entries/{tech,home,health,finance,work}
   mkdir -p ~/data/knowledge/archives
   mkdir -p ~/data/documents
   ```

2. Check if `~/data/knowledge/index.json` already exists:
   ```bash
   test -f ~/data/knowledge/index.json && echo "EXISTS" || echo "NOT FOUND"
   ```

3. If it does **not** exist, create a starter index:
   ```bash
   cat > ~/data/knowledge/index.json << 'EOF'
   {
     "version": 1,
     "updated": "",
     "categories": ["tech", "home", "health", "finance", "work"],
     "entries": []
   }
   EOF
   ```

   If it already exists, leave it alone — skip this step.

4. **Ask the user if they want sample data loaded:**

   > There's a `ui/sample-data/` folder with example knowledge entries (nginx config, Docker networking, certbot renewal, and a few others). These help you see the skill in action right away.
   >
   > **Options:**
   > - **Yes, load the sample data** — Copies demo entries so you can try the skill immediately.
   > - **No, start with an empty knowledge base** — Preferred if you want to start from scratch.

   If they want sample data:
   ```bash
   cp -r ui/sample-data/* ~/data/knowledge/
   ```

**Verification:**
```bash
test -d ~/data/knowledge/entries/tech && \
test -f ~/data/knowledge/index.json && \
test -d ~/data/documents && \
echo "PASS" || echo "FAIL"
```

---

### Phase 4: Choose Your Setup

**Ask the user:**

> The skill is installed. Your assistant can now store and recall information across sessions.
>
> Do you also want the web UI? It gives you a browser-based view of your knowledge base with search, filtering, and a markdown editor for viewing and editing entries directly in the browser.
>
> **Options:**
> - **Skill only** — Text-based through your assistant. No additional setup needed.
> - **Skill + web UI** — Browser interface with search and editor. Requires some additional setup.
>
> Which would you like?

**If they choose skill only:** Skip to Phase 7 (Final Verification).

**If they choose skill + web UI:** Continue to Phase 5.

---

### Phase 5: Web UI — Installation Path

**Ask the user:**

> Do you have [PAI Companion](https://github.com/chriscantey/pai-companion) installed and running?
>
> PAI Companion includes a portal server. If you have it, we'll add the knowledge pages and API routes to your existing portal. If not, we'll set up a standalone Docker service instead.
>
> **Options:**
> - **Yes, I have PAI Companion** — Adds pages and API routes to your existing portal.
> - **No, I don't have PAI Companion** — Standalone Docker path (takes a bit more setup).

**If they have PAI Companion:** Go to Phase 5A.

**If they don't have PAI Companion:** Go to Phase 5B.

---

### Phase 5A: Install into PAI Companion Portal

This path assumes PAI Companion is running and serving content from `~/portal/`.

**Step 1: Copy UI pages**

```bash
mkdir -p ~/portal/knowledge/ ~/portal/editor/
cp ui/public/knowledge/index.html ~/portal/knowledge/index.html
cp ui/public/editor/index.html ~/portal/editor/index.html
cp ui/public/editor/editor.js ~/portal/editor/editor.js
```

**Step 2: Add API routes to the portal server**

The knowledge and editor pages need three API route groups that must be added to `~/portal/server.ts`. Read the existing `~/portal/server.ts` to understand its structure, then add the following route groups.

The routes need these imports (add any that are missing):

```typescript
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join, extname, dirname, resolve } from "path";
```

They also need a `safePath` helper (add near the top of the file if not present):

```typescript
function safePath(root: string, subpath: string): string | null {
  const resolved = resolve(root, subpath);
  if (!resolved.startsWith(resolve(root))) return null;
  if (subpath.includes("..")) return null;
  return resolved;
}
```

Add these route groups inside the server's fetch handler, before the static file serving section. Adapt `DATA_DIR` to match whatever variable the existing server uses for its data directory (commonly `DATA_DIR` or a path like `/data`). `JSON_HEADERS` should be `{ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }` (or match the existing pattern).

**Route Group 1: Knowledge Base API**

```typescript
// GET /api/knowledge — return full index with file modification times
if (reqPath === "/api/knowledge" && req.method === "GET") {
  const indexPath = join(DATA_DIR, "knowledge", "index.json");
  if (!existsSync(indexPath)) {
    return new Response(JSON.stringify({ categories: [], entries: [] }), { headers: JSON_HEADERS });
  }
  const index = JSON.parse(readFileSync(indexPath, "utf-8"));
  for (const entry of index.entries ?? []) {
    try {
      const fp = join(DATA_DIR, "knowledge", entry.path);
      const stat = Bun.file(fp);
      const ms = stat.lastModified;
      if (ms > 0 && ms < 4102444800000) {
        entry.modified = new Date(ms).toISOString();
      }
    } catch {}
  }
  return new Response(JSON.stringify(index), { headers: JSON_HEADERS });
}

if (reqPath.startsWith("/api/knowledge/")) {
  const id = decodeURIComponent(reqPath.slice("/api/knowledge/".length));
  const indexPath = join(DATA_DIR, "knowledge", "index.json");
  if (!existsSync(indexPath)) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_HEADERS });
  }
  const index = JSON.parse(readFileSync(indexPath, "utf-8"));
  const entry = (index.entries ?? []).find((e: any) => e.id === id);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Entry not found" }), { status: 404, headers: JSON_HEADERS });
  }
  const entryPath = safePath(join(DATA_DIR, "knowledge"), entry.path);
  if (!entryPath) {
    return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400, headers: JSON_HEADERS });
  }

  if (req.method === "GET") {
    if (!existsSync(entryPath)) {
      return new Response(JSON.stringify({ error: "File not found" }), { status: 404, headers: JSON_HEADERS });
    }
    const content = readFileSync(entryPath, "utf-8");
    return new Response(JSON.stringify({ id, content, ...entry }), { headers: JSON_HEADERS });
  }

  if (req.method === "PUT") {
    try {
      const body = await req.json();
      if (typeof body.content !== "string") {
        return new Response(JSON.stringify({ error: "Content required" }), { status: 400, headers: JSON_HEADERS });
      }
      const dir = dirname(entryPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(entryPath, body.content, "utf-8");
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    } catch {
      return new Response(JSON.stringify({ error: "Failed to save" }), { status: 500, headers: JSON_HEADERS });
    }
  }
}
```

**Route Group 2: Documents API**

```typescript
// GET  /api/documents        — list all .md files
// GET  /api/documents/:name  — read document
// PUT  /api/documents/:name  — create/update document
// DELETE /api/documents/:name — delete document

if (reqPath === "/api/documents" || reqPath.startsWith("/api/documents/")) {
  const docsDir = join(DATA_DIR, "documents");

  if (req.method === "GET" && reqPath === "/api/documents") {
    if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
    const files = readdirSync(docsDir)
      .filter(f => f.endsWith(".md") && !f.startsWith("."))
      .map(f => {
        const stat = statSync(join(docsDir, f));
        return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    return new Response(JSON.stringify(files), { headers: JSON_HEADERS });
  }

  if (reqPath.startsWith("/api/documents/")) {
    const name = decodeURIComponent(reqPath.slice("/api/documents/".length));
    if (!name || name.includes("/")) {
      return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400, headers: JSON_HEADERS });
    }
    const filePath = safePath(docsDir, name);
    if (!filePath) {
      return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400, headers: JSON_HEADERS });
    }

    if (req.method === "GET") {
      if (!existsSync(filePath)) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_HEADERS });
      }
      const content = readFileSync(filePath, "utf-8");
      const stat = statSync(filePath);
      return new Response(JSON.stringify({ name, content, size: stat.size, modified: stat.mtime.toISOString() }), { headers: JSON_HEADERS });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      if (typeof body.content !== "string") {
        return new Response(JSON.stringify({ error: "Content required" }), { status: 400, headers: JSON_HEADERS });
      }
      if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
      writeFileSync(filePath, body.content, "utf-8");
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    }

    if (req.method === "DELETE") {
      if (!existsSync(filePath)) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_HEADERS });
      }
      unlinkSync(filePath);
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
    }
  }
}
```

**Route Group 3: Editor Session API**

```typescript
// GET /api/editor/session — retrieve saved tab state
// PUT /api/editor/session — save tab state

if (reqPath === "/api/editor/session") {
  const sessionFile = join(DATA_DIR, "editor-session.json");

  if (req.method === "GET") {
    if (!existsSync(sessionFile)) {
      return new Response(JSON.stringify({ tabs: [], activeIdx: 0 }), { headers: JSON_HEADERS });
    }
    const data = readFileSync(sessionFile, "utf-8");
    return new Response(data, { headers: JSON_HEADERS });
  }

  if (req.method === "PUT") {
    const body = await req.json();
    writeFileSync(sessionFile, JSON.stringify(body, null, 2), "utf-8");
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }
}
```

Also make sure the CORS preflight handler includes `DELETE` in the allowed methods:

```typescript
"Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
```

**Step 3: Make data volume read-write**

Check `~/portal/docker-compose.yml` for the data volume mount. If it's mounted as read-only (`:ro`), change it to read-write:

```yaml
# BEFORE (read-only — saves will fail)
- ${HOME}/data:/data:ro

# AFTER (read-write — required for editor saves)
- ${HOME}/data:/data
```

**Step 4: Rebuild the container**

The portal server's Dockerfile copies `server.ts` at build time. Editing the file on the host doesn't take effect until you rebuild.

```bash
cd ~/portal && docker compose up -d --build
```

**Important:** `docker compose restart` will NOT pick up the server.ts changes. You must use `--build`.

**Step 5: Add to portal homepage (optional)**

If you want Knowledge and Editor to appear as quick-link buttons on the portal homepage, patch `~/portal/index.html`:

Add these links in the quick-links section, after the Exchange link:

```html
<a href="/knowledge/" class="quick-link">
  <span class="icon">&#129504;</span> Knowledge
</a>
<a href="/editor/" class="quick-link">
  <span class="icon">&#128221;</span> Editor
</a>
```

And add `'knowledge'` and `'editor'` to the JavaScript skip list so they don't appear twice in the Pages grid:

```javascript
const skip = new Set([..., 'knowledge', 'editor']);
```

**Verification:**
```bash
test -f ~/portal/knowledge/index.html && \
test -f ~/portal/editor/index.html && \
test -f ~/portal/editor/editor.js && \
echo "Files: PASS" || echo "Files: FAIL"

echo -n "Knowledge API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9400/api/knowledge && echo ""
echo -n "Documents API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9400/api/documents && echo ""
echo -n "Editor session: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9400/api/editor/session && echo ""
```

All three API endpoints should return `200`. If any return `404`, the routes weren't added to `server.ts` correctly. If any return connection errors, the container needs to be rebuilt with `docker compose up -d --build`.

Tell the user:
> The knowledge UI and editor are installed. Open these in your browser:
> - Knowledge: `http://[your-server]:9400/knowledge/`
> - Editor: `http://[your-server]:9400/editor/`
>
> Replace `[your-server]` with your assistant's hostname or IP address.

Skip to Phase 7 (Final Verification).

---

### Phase 5B: Standalone Docker Setup

This path sets up the knowledge UI as a standalone Docker service with its own server. The standalone server already includes all required API routes (knowledge, documents, editor session).

**Check Docker:**
```bash
docker --version && echo "PASS" || echo "FAIL: Docker not found — install from https://docs.docker.com/engine/install/"
```

If Docker isn't installed, tell the user and wait for confirmation before continuing.

**Steps:**

1. Copy the UI directory to a persistent location:
   ```bash
   cp -r ui/ ~/services/knowledge-ui/
   ```

2. Create the data directory if it doesn't already exist (should be done in Phase 3):
   ```bash
   mkdir -p ~/data/knowledge ~/data/documents
   ```

3. Start the service:
   ```bash
   cd ~/services/knowledge-ui/ && docker compose up -d
   ```

4. Check it's running:
   ```bash
   docker compose -f ~/services/knowledge-ui/docker-compose.yml ps
   ```

**Verification:**
```bash
echo -n "Knowledge API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9450/api/knowledge && echo ""
echo -n "Documents API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9450/api/documents && echo ""
echo -n "Editor session: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9450/api/editor/session && echo ""
echo -n "Editor.js: " && test -f ~/services/knowledge-ui/public/editor/editor.js && echo "PASS" || echo "FAIL"
```

All three API endpoints should return `200`.

Tell the user:
> The knowledge UI is at `http://[your-server]:9450/knowledge/` and the editor is at `http://[your-server]:9450/editor/`. Replace `[your-server]` with your assistant server's hostname or IP.
>
> The standalone service runs on port 9450 by default to avoid conflicts with PAI Companion (9400). You can change this in `~/services/knowledge-ui/docker-compose.yml`.

Skip to Phase 7 (Final Verification).

---

### Phase 7: Final Verification

```bash
echo "=== Knowledge Skill Verification ==="
echo ""

echo -n "Skill file exists: "
test -f ~/.claude/skills/Knowledge/SKILL.md && echo "PASS" || echo "FAIL"

echo -n "Workflows exist: "
test -f ~/.claude/skills/Knowledge/Workflows/Learn.md && \
test -f ~/.claude/skills/Knowledge/Workflows/Recall.md && \
test -f ~/.claude/skills/Knowledge/Workflows/Browse.md && \
echo "PASS" || echo "FAIL"

echo -n "Data directory exists: "
test -d ~/data/knowledge/entries && echo "PASS" || echo "FAIL"

echo -n "Index file exists: "
test -f ~/data/knowledge/index.json && echo "PASS" || echo "FAIL"

echo ""
echo "=== Verification Complete ==="
```

**If the web UI was installed, also verify the API endpoints:**

For PAI Companion (port 9400):
```bash
echo -n "Knowledge API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9400/api/knowledge && echo ""
echo -n "Documents API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9400/api/documents && echo ""
echo -n "Editor session: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9400/api/editor/session && echo ""
echo -n "Editor.js exists: " && test -f ~/portal/editor/editor.js && echo "PASS" || echo "FAIL"
```

For standalone Docker (port 9450):
```bash
echo -n "Knowledge API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9450/api/knowledge && echo ""
echo -n "Documents API: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9450/api/documents && echo ""
echo -n "Editor session: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:9450/api/editor/session && echo ""
echo -n "Editor.js exists: " && test -f ~/services/knowledge-ui/public/editor/editor.js && echo "PASS" || echo "FAIL"
```

Tell the user:

> The Knowledge skill is installed. Your assistant can now store and recall information.
>
> Try it:
> - "Remember that nginx proxy_pass needs a trailing slash to strip the prefix"
> - "What do I know about nginx?"
> - "Show my knowledge base"
>
> The skill learns your categories and preferences over time. The defaults are: tech, home, health, finance, work. To add a category, just use it — the Learn workflow will create the directory and update the index automatically. Or edit `~/data/knowledge/index.json` directly and ask your assistant to recreate the entry directories.
>
> **Note:** This is a reference implementation. The entry format, categories, and index structure are all plain files you can adapt. If something doesn't fit how you think, ask your assistant to change it.
