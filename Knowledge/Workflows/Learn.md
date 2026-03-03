# Learn Workflow

Intake new knowledge into the personal knowledge base.

## Trigger Phrases
- "remember this", "save this", "learn this", "store this"
- `/learn`
- "add to my knowledge base"

## Process

### 1. Extract Information

From the conversation or user input, identify:
- **Core knowledge**: The actual information to store
- **Title**: Concise, searchable title (use for filename slug)
- **Category**: Choose from your configured categories (e.g., tech, home, health, finance, work)
- **Tags**: 3-7 relevant keywords for index search

### 2. Generate Entry

Create markdown file at `~/data/knowledge/entries/<category>/<slug>.md`:

```markdown
---
id: <slug>
title: <Title>
tags: [tag1, tag2, tag3]
category: <category>
created: <YYYY-MM-DD>
source: conversation | manual | reference
---

# <Title>

## Summary
<1-3 sentence overview>

## Details
<Full knowledge content, organized with headers as needed>

## Key Points
- <Bullet points of most important takeaways>

## Related
- <Links to related entries if any>
```

### 3. Update Index

Read `~/data/knowledge/index.json`, add entry metadata:

```json
{
  "id": "<slug>",
  "title": "<Title>",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "<category>",
  "created": "<YYYY-MM-DD>",
  "path": "entries/<category>/<slug>.md"
}
```

Write updated index back.

### 4. Confirm

Tell user what was saved:
- Title
- Category
- Tags assigned
- Path to file (so they can edit if needed)

## Guidelines

- **Slug format**: lowercase, hyphens, no special chars (e.g., `nginx-reverse-proxy-config`)
- **Tags**: Include product names, technologies, concepts, actions
- **Category selection**: When unclear, ask user or default to most likely
- **Existing entries**: If similar entry exists, ask whether to update or create new

### Content Fidelity (CRITICAL)

**Default: Preserve full content.** The Summary section is *additive* (a quick-reference aid for search and recall), never a *replacement* for the original content.

| Content Type | How to Handle |
|---|---|
| **Procedures, checklists, processes** | Preserve every step exactly. Clean up language/formatting, but never drop steps, thresholds, system names, or conditional logic. |
| **Meeting notes, technical findings** | Preserve all specifics: names, dates, IDs, commands, URLs, decisions. Organize with headers for clarity. |
| **General knowledge, concepts** | Full content in Details section. Summary section provides a quick overview. Key Points distills takeaways. |
| **Conversational context** | Extract the actual knowledge from conversation, but preserve all specifics. Remove only conversational filler ("um", "like", back-and-forth). |

**Rules:**
- The **Details** section always contains the full, substantive content.
- The **Summary** section is 1-3 sentences for quick recall. It supplements, never replaces.
- The **Key Points** section highlights the most important items but does not substitute for Details.
- When in doubt, keep more rather than less. Lost detail cannot be recovered.
- Never reduce specific numbers, thresholds, system names, or conditional branches to vague summaries.
