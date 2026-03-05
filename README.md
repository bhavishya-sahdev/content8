# auto-blog

**Self-hosted content engine that turns your project into a discovery magnet.**

You built something great. Nobody found it.

`auto-blog` is an open-source, webhook-driven blog engine built for developers who want organic traffic and AI discoverability for their projects — without becoming content marketers. Hook it up to an n8n workflow or any AI pipeline, and it auto-publishes SEO-optimized articles *about your project*: tutorials, comparisons, use cases, changelogs. It also generates an `llms.txt` so AI assistants like Perplexity, ChatGPT, and Claude can discover and recommend your work.

---

## Why

- Comparison posts, use-case articles, and tutorials drive **3–5× more conversions** than generic content
- AI Overviews appear in ~16% of searches — your content needs structured data to survive this
- Perplexity, ChatGPT, and Claude surface tools they've "read about" — `llms.txt` puts your project in that pool
- Writing one good article takes 4–8 hours. This takes a webhook call.

---

## How it works

```
Your project context (README, docs, changelog)
      ↓
n8n / any AI pipeline (or write your own)
      ↓
Claude / GPT-4 generates: tutorial, comparison, use-case, changelog post
      ↓
POST /api/blog  ← webhook
      ↓
PostgreSQL → MDX render → /blog/[slug]
      ↓
SEO metadata + structured data + llms.txt
```

---

## Features

| | |
|---|---|
| **Webhook-driven** | POST from n8n, Make, Zapier, or your own cron |
| **MDX rendering** | Full component support — callouts, code blocks, tables |
| **SEO-ready** | Open Graph, Twitter cards, JSON-LD, XML sitemap |
| **AI-discoverability** | `/llms.txt` and `/llms-full.txt` generated from your posts |
| **RSS feed** | `/blog/rss.xml` — last 50 posts, 1h cache |
| **Related posts** | Auto-linked by category |
| **Duplicate-safe** | Slug-based deduplication with `onConflictDoNothing` |
| **Secret validation** | HMAC webhook secret support |
| **ISR** | 1h revalidation — fast static pages, always fresh |

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/your-username/auto-blog
cd auto-blog
bun install   # or: npm install / pnpm install

# 2. Configure
cp .env.example .env
# Fill in DATABASE_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME

# 3. Push schema
bun run db:generate
bun run db:migrate

# 4. Dev server
bun run dev
```

Visit `http://localhost:3000` → `/blog`

**One-click deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/auto-blog)

Set `DATABASE_URL` (Neon free tier works) and you're live.

---

## Webhook API

### Publish a post

```bash
curl -X POST https://your-blog.com/api/blog \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "data": {
      "meta": {
        "title": "How to use MyTool for database migrations",
        "description": "A step-by-step guide to running zero-downtime migrations with MyTool.",
        "category": "Tutorials",
        "slug": "mytool-database-migrations",
        "tags": ["postgres", "migrations", "devops"],
        "keywords": ["database migration tool", "zero-downtime migrations", "mytool guide"],
        "featuredImage": "https://example.com/og.jpg"
      },
      "content": "# How to use MyTool for database migrations\n\n..."
    }
  }'
```

**Content types that perform best:**
- `"category": "Comparisons"` — "MyTool vs X", "Best tools for Y"
- `"category": "Tutorials"` — "How to do X with MyTool"
- `"category": "Use Cases"` — "How [company type] uses MyTool"
- `"category": "Changelog"` — "What's new in v2.0"

### Get latest posts

```bash
GET /api/blog
# Returns last 10 posts (no content body)
```

---

## AI Discoverability

Once deployed, your project gets:

**`/llms.txt`** *(coming in v0.2)*
```
# MyTool

> Zero-downtime database migration tool for PostgreSQL.

## Documentation
- [Getting started](/blog/getting-started)
- [How it works](/blog/how-it-works)

## Tutorials
- [Zero-downtime migrations](/blog/mytool-database-migrations)
- [MyTool vs Flyway](/blog/mytool-vs-flyway)
```

This file is consumed by AI assistants that want to understand what your project does, so they can recommend it when users ask relevant questions.

---

## n8n Setup

In your n8n workflow, set the **HTTP Request** node to:

| Field | Value |
|---|---|
| Method | `POST` |
| URL | `https://your-blog.com/api/blog` |
| Header | `x-webhook-secret: your-secret` |
| Body | JSON matching the payload schema above |

Pass your project's README, docs, or changelog as context to the AI agent. The agent should generate content *about your project* — not generic content.

**Prompt tip:**
```
You are a technical content writer. Write a blog post about [YOUR PROJECT NAME].

Context about the project:
[paste README or relevant docs section]

Article type: [Tutorial / Comparison / Use Case / Changelog]
Target keyword: [keyword you want to rank for]

Output format:
{
  "data": {
    "meta": { ... },
    "content": "# ..."
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your deployed URL (used in RSS, sitemap, OG) |
| `NEXT_PUBLIC_SITE_NAME` | No | Blog name in UI (default: `Auto Blog`) |
| `WEBHOOK_SECRET` | No | Validates `x-webhook-secret` header |

---

## Routes

| Route | Description |
|---|---|
| `/blog` | Listing page — featured post + article grid |
| `/blog/[slug]` | Post with MDX rendering, related posts, SEO metadata |
| `/blog/rss.xml` | RSS feed (last 50 posts) |
| `/blog/sitemap.xml` | Dynamic XML sitemap |
| `/llms.txt` | AI-discoverability file *(v0.2)* |
| `POST /api/blog` | Webhook endpoint — publishes a post |
| `GET /api/blog` | Returns latest 10 posts |

---

## Database Schema

```sql
CREATE TABLE posts (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(256) NOT NULL,
  description    VARCHAR NOT NULL,
  slug           VARCHAR NOT NULL UNIQUE,
  author         VARCHAR DEFAULT 'Author',
  category       VARCHAR NOT NULL,
  keywords       TEXT[] DEFAULT '{}',
  tags           TEXT[] DEFAULT '{}',
  content        TEXT NOT NULL,
  featured_image VARCHAR,
  published_at   TIMESTAMP DEFAULT NOW()
);
```

---

## Stack

- **Next.js 15** App Router + TypeScript
- **PostgreSQL** (Neon free tier supported) + Drizzle ORM
- **Tailwind CSS v4** — dark mode first
- **next-mdx-remote** — MDX rendering in RSC
- **react-syntax-highlighter** — code block highlighting

---

## Contributing

See [ROADMAP.md](./ROADMAP.md) for what's planned. Each item in Phase 1 is independently shippable.

1. Fork & clone
2. `cp .env.example .env` + fill in a Neon DB URL
3. `bun run db:migrate && bun run dev`
4. Pick a Phase 1 task, open a PR

---

## License

MIT
