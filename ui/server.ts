#!/usr/bin/env bun
/**
 * Knowledge UI Server
 *
 * Standalone server for the Knowledge skill web UI.
 * Serves the knowledge page, editor, and all required APIs.
 *
 * Designed to run inside Docker, with mounted volumes:
 *   - ~/data  → /data  (knowledge base, documents, editor session)
 *   - ./public → /public (static UI files)
 *
 * API:
 *   GET  /api/knowledge           — list all entries (index)
 *   GET  /api/knowledge/:id       — get entry content
 *   PUT  /api/knowledge/:id       — save entry content
 *   GET  /api/documents           — list all documents
 *   GET  /api/documents/:name     — read document
 *   PUT  /api/documents/:name     — create/update document
 *   DELETE /api/documents/:name   — delete document
 *   GET  /api/editor/session      — retrieve saved tab state
 *   PUT  /api/editor/session      — save tab state
 *   GET  /images/knowledge/:path  — serve knowledge images
 *   GET  /*                       — serve static files from /public
 */

import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join, extname, dirname, resolve } from "path";

const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR || "/data";
const KNOWLEDGE_DIR = join(DATA_DIR, "knowledge");
const PUBLIC_DIR = process.env.PUBLIC_DIR || "/public";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/plain",
};

const JSON_H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

/** Validate that a resolved path stays within the given root directory. */
function safePath(root: string, subpath: string): string | null {
  const resolved = resolve(root, subpath);
  if (!resolved.startsWith(resolve(root))) return null;
  if (subpath.includes("..")) return null;
  return resolved;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const reqPath = url.pathname;

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // ── API: Knowledge base ──────────────────────────────────────────

    // GET /api/knowledge — list entries
    if (reqPath === "/api/knowledge" && req.method === "GET") {
      const indexPath = join(KNOWLEDGE_DIR, "index.json");
      if (!existsSync(indexPath)) {
        return new Response(JSON.stringify({ categories: [], entries: [] }), { headers: JSON_H });
      }
      const index = JSON.parse(readFileSync(indexPath, "utf-8"));
      for (const entry of index.entries ?? []) {
        try {
          const fp = join(KNOWLEDGE_DIR, entry.path);
          const stat = Bun.file(fp);
          const ms = stat.lastModified;
          if (ms > 0 && ms < 4102444800000) {
            entry.modified = new Date(ms).toISOString();
          }
        } catch { /* skip if file missing */ }
      }
      return new Response(JSON.stringify(index), { headers: JSON_H });
    }

    // /api/knowledge/:id — read or write entry
    if (reqPath.startsWith("/api/knowledge/") && reqPath !== "/api/knowledge") {
      const entryId = decodeURIComponent(reqPath.slice("/api/knowledge/".length));
      const indexPath = join(KNOWLEDGE_DIR, "index.json");

      if (!existsSync(indexPath)) {
        return new Response(JSON.stringify({ error: "Index not found" }), { status: 404, headers: JSON_H });
      }

      const index = JSON.parse(readFileSync(indexPath, "utf-8"));
      const entry = (index.entries ?? []).find((e: any) => e.id === entryId);

      if (!entry) {
        return new Response(JSON.stringify({ error: "Entry not found" }), { status: 404, headers: JSON_H });
      }

      const entryPath = safePath(KNOWLEDGE_DIR, entry.path);
      if (!entryPath) {
        return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400, headers: JSON_H });
      }

      if (req.method === "GET") {
        if (!existsSync(entryPath)) {
          return new Response(JSON.stringify({ error: "File not found" }), { status: 404, headers: JSON_H });
        }
        const content = readFileSync(entryPath, "utf-8");
        return new Response(JSON.stringify({ id: entryId, content, ...entry }), { headers: JSON_H });
      }

      if (req.method === "PUT") {
        try {
          const body = await req.json();
          if (typeof body.content !== "string") {
            return new Response(JSON.stringify({ error: "Content required" }), { status: 400, headers: JSON_H });
          }
          const dir = dirname(entryPath);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          writeFileSync(entryPath, body.content);
          return new Response(JSON.stringify({ ok: true }), { headers: JSON_H });
        } catch {
          return new Response(JSON.stringify({ error: "Failed to save" }), { status: 500, headers: JSON_H });
        }
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: JSON_H });
    }

    // ── API: Documents ───────────────────────────────────────────────

    if (reqPath === "/api/documents" || reqPath.startsWith("/api/documents/")) {
      const docsDir = join(DATA_DIR, "documents");

      // GET /api/documents — list all .md files
      if (req.method === "GET" && reqPath === "/api/documents") {
        if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
        try {
          const files = readdirSync(docsDir)
            .filter(f => f.endsWith(".md") && !f.startsWith("."))
            .map(f => {
              const stat = statSync(join(docsDir, f));
              return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
            })
            .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
          return new Response(JSON.stringify(files), { headers: JSON_H });
        } catch {
          return new Response(JSON.stringify({ error: "Failed to list documents" }), { status: 500, headers: JSON_H });
        }
      }

      // /api/documents/:name — CRUD individual document
      if (reqPath.startsWith("/api/documents/")) {
        const name = decodeURIComponent(reqPath.slice("/api/documents/".length));
        if (!name || name.includes("/")) {
          return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400, headers: JSON_H });
        }
        const filePath = safePath(docsDir, name);
        if (!filePath) {
          return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400, headers: JSON_H });
        }

        if (req.method === "GET") {
          if (!existsSync(filePath)) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_H });
          }
          const content = readFileSync(filePath, "utf-8");
          const stat = statSync(filePath);
          return new Response(JSON.stringify({ name, content, size: stat.size, modified: stat.mtime.toISOString() }), { headers: JSON_H });
        }

        if (req.method === "PUT") {
          try {
            const body = await req.json();
            if (typeof body.content !== "string") {
              return new Response(JSON.stringify({ error: "Content required" }), { status: 400, headers: JSON_H });
            }
            if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
            writeFileSync(filePath, body.content, "utf-8");
            return new Response(JSON.stringify({ ok: true }), { headers: JSON_H });
          } catch {
            return new Response(JSON.stringify({ error: "Failed to write" }), { status: 500, headers: JSON_H });
          }
        }

        if (req.method === "DELETE") {
          if (!existsSync(filePath)) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_H });
          }
          unlinkSync(filePath);
          return new Response(JSON.stringify({ ok: true }), { headers: JSON_H });
        }

        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: JSON_H });
      }
    }

    // ── API: Editor session persistence ──────────────────────────────

    if (reqPath === "/api/editor/session") {
      const sessionFile = join(DATA_DIR, "editor-session.json");

      if (req.method === "GET") {
        if (!existsSync(sessionFile)) {
          return new Response(JSON.stringify({ tabs: [], activeIdx: 0 }), { headers: JSON_H });
        }
        try {
          const data = readFileSync(sessionFile, "utf-8");
          return new Response(data, { headers: JSON_H });
        } catch {
          return new Response(JSON.stringify({ tabs: [], activeIdx: 0 }), { headers: JSON_H });
        }
      }

      if (req.method === "PUT") {
        try {
          const body = await req.json();
          writeFileSync(sessionFile, JSON.stringify(body, null, 2), "utf-8");
          return new Response(JSON.stringify({ ok: true }), { headers: JSON_H });
        } catch {
          return new Response(JSON.stringify({ error: "Failed to save session" }), { status: 500, headers: JSON_H });
        }
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: JSON_H });
    }

    // ── Images: knowledge images ─────────────────────────────────────

    if (reqPath.startsWith("/images/knowledge/")) {
      const imgRelPath = reqPath.slice("/images/knowledge/".length);
      const imgPath = safePath(join(KNOWLEDGE_DIR, "images"), imgRelPath);
      if (!imgPath) {
        return new Response("Forbidden", { status: 403 });
      }
      if (existsSync(imgPath) && statSync(imgPath).isFile()) {
        const mime = MIME_TYPES[extname(imgPath).toLowerCase()] ?? "application/octet-stream";
        return new Response(Bun.file(imgPath), {
          headers: { "Content-Type": mime, "Cache-Control": "public, max-age=86400" },
        });
      }
      return new Response("Not found", { status: 404 });
    }

    // ── Static file serving ──────────────────────────────────────────

    let filePath = join(PUBLIC_DIR, reqPath === "/" ? "/index.html" : reqPath);

    // Directory → index.html
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const mime = MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
      return new Response(Bun.file(filePath), { headers: { "Content-Type": mime } });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Knowledge UI server running on http://0.0.0.0:${PORT}`);
console.log(`  Data directory: ${DATA_DIR}`);
console.log(`  Knowledge data: ${KNOWLEDGE_DIR}`);
console.log(`  Static files:   ${PUBLIC_DIR}`);
