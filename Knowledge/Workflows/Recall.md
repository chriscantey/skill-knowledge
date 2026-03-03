# Recall Workflow

Search and retrieve stored knowledge.

## Trigger Phrases
- "what do I know about...", "how do I..."
- "look up", "find in my knowledge"
- "do I have anything stored about..."
- `/recall <query>`

## Process

### 1. Load Index

Read `~/data/knowledge/index.json` — this is lightweight, just metadata.

### 2. Search Index

Search strategy (in order):
1. **Exact title match**: Query matches title directly
2. **Tag match**: Query terms match tags
3. **Partial title match**: Query terms appear in title
4. **Category filter**: If query mentions category (e.g., "tech stuff about X")

### 3. Present Matches

If matches found, present as a list:
```
Found 3 entries matching "docker":

1. **Docker Compose Networking** [tech]
   Tags: docker, networking, compose, containers

2. **Container Backup Strategy** [tech]
   Tags: docker, backup, volumes, cron

3. **Service Deployment Checklist** [work]
   Tags: deployment, docker, production
```

### 4. Load on Demand

- If single match: Load and display the full entry
- If multiple matches: Ask which one to load, or let user specify
- If no matches: Offer to do a deep search (grep across entry content)

### 5. Deep Search (when needed)

If index search fails, search across all entry content files and report matching files, then load relevant ones.

## Archive Filtering

Entries tagged with `archive` are **excluded from search results by default**. This keeps dated or historical items out of active recall.

**Include archived items when:**
- User explicitly says "include archived", "show all", "search everything"
- User specifically asks about a topic that only archived items cover
- User says "show archived" or "find in archive"

**When displaying results with archive filter active:**
- Show a note at the bottom: `(N archived entries hidden. Say "include archived" to see all.)`

## Guidelines

- **Index first**: Always search index before loading content files
- **Lazy loading**: Don't load entry content until specifically needed
- **Relevance**: Rank by match quality (exact > tag > partial)
- **Context**: When displaying entry, include the Summary section first
- **No matches**: Suggest checking spelling, trying synonyms, or browsing by category
- **Archive awareness**: If no active results found but archived ones exist, mention them
