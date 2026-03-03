# Browse Workflow

Explore the knowledge base by category or list all entries.

## Trigger Phrases
- "show my knowledge", "list knowledge"
- "what's in my knowledge base"
- "browse knowledge", `/knowledge`
- "show me <category> knowledge"

## Process

### 1. Load Index

Read `~/data/knowledge/index.json`.

### 2. Generate Overview

If no specific category requested, show summary:

```
Knowledge Base Overview:

| Category | Entries |
|----------|---------|
| tech     | 42      |
| home     | 15      |
| health   | 8       |
| finance  | 11      |
| work     | 23      |

Total: 99 entries

Say "show me <category>" to list entries, or ask about a specific topic.
```

### 3. Category Drill-Down

If category specified, list entries:

```
Tech Knowledge (42 entries):

1. Docker Compose Networking
   Tags: docker, networking, compose
   Created: 2026-01-15

2. Certbot Certificate Renewal
   Tags: ssl, certificates, letsencrypt
   Created: 2026-01-12

...

Say "tell me about <title>" to load full entry.
```

### 4. Load Specific Entry

When user requests specific entry, load the markdown file and display content.

## Archive Filtering

Entries tagged with `archive` are **hidden from browse views by default**. The overview should show a separate archived count.

**Display format with archive awareness:**
```
Knowledge Base Overview:

| Category | Active | Archived |
|----------|--------|----------|
| tech     | 42     | 8        |
| home     | 15     | 3        |
| work     | 23     | 5        |
...

Total: 80 active entries (16 archived)

Say "show archived" to include archived entries in listings.
```

**Include archived items when:**
- User says "show all", "include archived", "show archived"
- User browses with explicit archive intent

## Guidelines

- **Summary first**: Show counts and categories before diving into details
- **Sorted display**: Show entries sorted by created date (newest first) or alphabetically
- **Lazy content**: Only load full markdown when user requests specific entry
- **Empty categories**: Show categories even if empty (helps user know what's available)
- **Archive count**: Always show how many archived entries exist per category
