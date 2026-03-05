# Auto Blog

Standalone automated blog engine. Receives AI-generated MDX posts via webhook and serves them as a polished, SEO-optimized publication.

**Stack:** Next.js 15 · PostgreSQL (Neon) · Drizzle ORM · Tailwind v4 · MDX

---

## Quick Start

```bash
# 1. Install
bun install   # or: npm install / pnpm install

# 2. Configure
cp .env.example .env
# Fill in DATABASE_URL and optionally WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME

# 3. Push schema to DB
bun run db:generate && bun run db:migrate

# 4. Run
bun run dev
```

Visit `http://localhost:3000` → redirects to `/blog`.

---

## Webhook API

Send AI-generated posts to the blog via HTTP POST:

```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "data": {
      "meta": {
        "title": "My First Post",
        "description": "A short description.",
        "category": "Engineering",
        "slug": "my-first-post",
        "tags": ["nextjs", "ai"],
        "keywords": ["nextjs", "automation"],
        "featuredImage": "https://example.com/image.jpg"
      },
      "content": "# Hello World\n\nThis is the MDX content of the post."
    }
  }'
```

Duplicate slugs are silently ignored (`onConflictDoNothing`).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `WEBHOOK_SECRET` | No | If set, requests must include `x-webhook-secret` header |
| `NEXT_PUBLIC_SITE_URL` | No | Used in RSS, sitemap, OG URLs (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_NAME` | No | Blog name displayed in UI (default: `Auto Blog`) |

---

## Routes

| Route | Description |
|---|---|
| `/blog` | Blog listing — featured + grid |
| `/blog/[slug]` | Individual post with MDX rendering |
| `/blog/rss.xml` | RSS feed (last 50 posts, 1h cache) |
| `/blog/sitemap.xml` | XML sitemap |
| `POST /api/blog` | Webhook to publish a post |
| `GET /api/blog` | Returns latest 10 posts (no content) |

---

## DB Schema

```sql
CREATE TABLE posts (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(256) NOT NULL,
  description   VARCHAR NOT NULL,
  slug          VARCHAR NOT NULL UNIQUE,
  author        VARCHAR DEFAULT 'Author',
  category      VARCHAR NOT NULL,
  keywords      TEXT[] DEFAULT '{}',
  tags          TEXT[] DEFAULT '{}',
  content       TEXT NOT NULL,
  featured_image VARCHAR,
  published_at  TIMESTAMP DEFAULT NOW()
);
```

---

## n8n Integration

Set the webhook node URL in your n8n workflow to:
```
https://your-domain.com/api/blog
```

Add header `x-webhook-secret` if `WEBHOOK_SECRET` is configured.

See [ROADMAP.md](./ROADMAP.md) for what's next.
