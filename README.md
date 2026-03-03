# Knowledge Skill for Claude Code

A skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) / [PAI](https://github.com/danielmiessler/PAI) that gives your AI assistant a personal knowledge base: a place to store things you want it to remember and recall them naturally in conversation. Tell it to "remember" something, and it saves it. Ask it "how do I" or "what do I know about" something, and it searches what you've stored.

This grew out of wanting a simple, assistant-native way to retain information across sessions without relying on conversation history. It stores entries as plain markdown files, searches an index without reading every file, and integrates naturally with Claude Code's context system.

> **This is a reference, not a product.** It reflects my setup as of early 2026. It works well for me, but the real value is using it as a starting point. Clone it, hand it to your assistant, and have them adapt it to how you actually think and work. Change the categories, the entry format, the UI, whatever. The best version of this is the one your assistant builds for you.

**Blog post:** [A Knowledge Base for Your AI Assistant](https://chriscantey.com/posts/2026-03-02-a-knowledge-base-for-your-ai-assistant/) walks through what this is, how it works, and why I built it this way.

## Prerequisites

You need [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed with a `~/.claude/skills/` directory (standard Claude Code setup).

**Optional — for the web UI:**

[Docker](https://docs.docker.com/engine/install/) is required to run the knowledge base web interface as a standalone service. If you already have [PAI Companion](https://github.com/chriscantey/pai-companion), you can skip the Docker setup entirely.

**Note:** The web UI is designed for local network use on your assistant VM. It has no authentication or access controls. Do not expose it to the public internet.

## What's Inside

**Skill files** (`Knowledge/`) with three workflows:

- **Learn** — Saves new information to your knowledge base. Creates a structured markdown entry, updates the index. Triggered by "remember this", "save this", "store this".

- **Recall** — Searches your knowledge base and returns matching entries. Uses index-first search for speed. Triggered by "what do I know about", "how do I", "look up".

- **Browse** — Shows an overview of your knowledge base by category, or lists entries in a specific category. Triggered by "show my knowledge", "browse knowledge".

**Web UI** (`ui/`) — A browser-based interface for viewing and searching your knowledge base entries, plus a markdown editor for editing entries directly in the browser. Two installation paths: into an existing PAI Companion portal, or as a standalone Docker service.

## Install

### AI-Assisted (Recommended)

Clone the repo and point your Claude Code assistant at the install instructions:

```bash
cd ~ && git clone https://github.com/chriscantey/skill-knowledge.git
```

Then tell your assistant:

```
Read ~/skill-knowledge/INSTALL.md and follow its instructions.
```

The assistant will walk you through setup, ask if you want the web UI, and handle everything from there.

### Manual

1. Copy the `Knowledge/` folder into `~/.claude/skills/`:
   ```bash
   cp -r Knowledge/ ~/.claude/skills/Knowledge/
   ```

2. Create the knowledge base data directory:
   ```bash
   mkdir -p ~/data/knowledge/entries/{tech,home,health,finance,work}
   mkdir -p ~/data/knowledge/archives
   ```

3. Create an empty index:
   ```bash
   echo '{"version":1,"updated":"","categories":["tech","home","health","finance","work"],"entries":[]}' > ~/data/knowledge/index.json
   ```

4. Your assistant picks up the skill automatically. No restart needed.

## Compatibility

This skill works with:

- **[Claude Code](https://docs.anthropic.com/en/docs/claude-code)** — Drop the `Knowledge/` folder into `~/.claude/skills/` and it loads automatically.
- **[PAI](https://github.com/danielmiessler/PAI)** (Personal AI Infrastructure) — Same skills folder structure. Works out of the box.
- **[PAI Companion](https://github.com/chriscantey/pai-companion)** — The web UI installs directly into your existing portal service, no separate server needed.

## Context

I wrote about the broader pattern of building personal tools with your AI assistant in [Build or Buy May Have Changed, For Now](https://chriscantey.com/posts/2026-02-24-build-or-buy-may-have-changed/). The short version: the knowledge base is useful, but the more interesting part is that your assistant can take this as a reference and build something tuned to how you actually think and work.

## License

Use it however you like. If you build on it and learn something, sharing back is appreciated but not required.
