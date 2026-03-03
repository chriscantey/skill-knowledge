---
name: Knowledge
description: Personal knowledge base for storing and recalling information. USE WHEN user says remember this, save this, learn this, store this OR asks how do I, what do I know about, recall, look up stored info. Index-first search, lazy content loading.
---

# Knowledge

Personal knowledge base with intentional intake and structured recall. Stores information across customizable domains with lightweight index search.

## Architecture

- **Index**: `~/data/knowledge/index.json` — titles, tags, categories, paths only
- **Entries**: `~/data/knowledge/entries/<category>/<slug>.md` — full content
- **Archives**: `~/data/knowledge/archives/` — preserved originals from migrations
- **Search flow**: Index first (fast) -> Load specific entries on demand (lazy)

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Learn** | "remember this", "save this", "learn this", `/learn` | `Workflows/Learn.md` |
| **Recall** | "what do I know about", "how do I", "look up" | `Workflows/Recall.md` |
| **Browse** | "show my knowledge", "list knowledge", `/knowledge` | `Workflows/Browse.md` |

## Examples

**Example 1: Intake new knowledge**
```
User: "Remember that nginx proxy_pass requires a trailing slash to strip the location prefix"
-> Invokes Learn workflow
-> Creates entry with tags, updates index
-> Confirms what was saved
```

**Example 2: Recall stored knowledge**
```
User: "How do I configure nginx reverse proxy?"
-> Invokes Recall workflow
-> Searches index by tags/title
-> Returns matching entry content
```

**Example 3: Browse knowledge base**
```
User: "What do I have stored about tech?"
-> Invokes Browse workflow
-> Lists entries in tech category from index
-> User can request specific entry details
```
