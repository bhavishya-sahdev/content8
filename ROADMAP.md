# Auto Blog — MVP Roadmap

An automated blog engine that ingests AI-generated content via webhook and serves it as a polished, SEO-optimized publication.

---

## Phase 0 — Baseline (Done ✓)

Ported core feature from portfolio-v4 into a standalone repo.

- [x] Next.js 15 App Router + TypeScript + Tailwind v4
- [x] PostgreSQL schema (`posts` table) with Drizzle ORM
- [x] `POST /api/blog` webhook endpoint (receives n8n-generated posts)
- [x] `GET /api/blog` endpoint (returns latest posts)
- [x] Blog listing page (`/blog`) — featured post + grid
- [x] Individual post page (`/blog/[slug]`) — MDX rendering, related posts
- [x] MDX content sanitizer (fixes escaped chars, malformed tables, JSX conflicts)
- [x] RSS feed (`/blog/rss.xml`)
- [x] SEO utilities (Open Graph, Twitter cards, JSON-LD)
- [x] Sitemap generation
- [x] Environment-variable-driven config (no hardcoded personal info)
- [x] Optional webhook secret validation

---

## Phase 1 — Production-Ready MVP

Make this deployable and independently usable by anyone.

### 1.1 Auth & Security
- [ ] Validate webhook requests with HMAC signature (not just a static secret)
- [ ] Rate limiting on `POST /api/blog` (e.g. Upstash Ratelimit or middleware)
- [ ] Admin panel behind auth to view/delete/edit posts (better-auth or Clerk)

### 1.2 Content Quality
- [ ] Post validation schema (Zod) on the webhook endpoint — reject malformed payloads early
- [ ] Duplicate detection by content hash (beyond slug uniqueness)
- [ ] Draft/published status field on posts table — queue posts before publishing
- [ ] Scheduled publishing: `publishAt` timestamp, cron job to flip status

### 1.3 UX & Discovery
- [ ] Tag/category filter pages (`/blog/tag/[tag]`, `/blog/category/[cat]`)
- [ ] Full-text search (PostgreSQL `tsvector` or Algolia)
- [ ] Pagination / infinite scroll on listing page
- [ ] Reading progress bar on post page
- [ ] Estimated read time displayed in listing cards (already computed, just surfaced better)

### 1.4 SEO & Performance
- [ ] `generateStaticParams` for popular slugs (SSG for top posts)
- [ ] Open Graph image generation (`/api/og?slug=...` using `@vercel/og`)
- [ ] Canonical URLs
- [ ] Structured data (JSON-LD) rendered in `<head>` of post pages

---

## Phase 2 — Multi-Source Automation

Move beyond a single n8n pipeline and support multiple content sources.

### 2.1 Source Registry
- [ ] `sources` table — track where each post came from (subreddit, HN, RSS feed, etc.)
- [ ] `POST /api/blog` accepts `source` field, stored per-post
- [ ] Source page: `/blog/source/[source]` — filter by origin

### 2.2 Native Ingestion Pipelines
Replace dependency on external n8n:
- [ ] Built-in Reddit scraper (cron + Reddit API) — configurable subreddits via env
- [ ] HackerNews top stories pipeline
- [ ] RSS/Atom feed reader as a content source
- [ ] Each pipeline → same internal queue → same AI writer → same webhook

### 2.3 AI Writer Integration
- [ ] Built-in AI writer using Claude API (`claude-sonnet-4-6`)
- [ ] Configurable prompt templates per source type
- [ ] Content quality scoring — auto-discard posts below threshold
- [ ] Keyword targeting: bias generation toward specific topics

---

## Phase 3 — Analytics & Monetization

Turn the blog into a product.

### 3.1 Analytics
- [ ] Page view tracking (privacy-first, no cookies — simple server-side counter)
- [ ] `post_views` table — increment on each visit
- [ ] Admin dashboard: top posts by views, posts per day, category breakdown
- [ ] Trending posts widget on listing page

### 3.2 Email Newsletter
- [ ] Subscriber signup form + `subscribers` table
- [ ] Weekly digest email — top 5 posts — sent via Resend
- [ ] Unsubscribe flow with token-based auth
- [ ] Welcome email on subscribe

### 3.3 Comments
- [ ] Giscus (GitHub Discussions) or built-in comment table
- [ ] Comment moderation queue in admin panel

### 3.4 Monetization Hooks
- [ ] Sponsored post flag on `posts` table
- [ ] `noindex` toggle per post
- [ ] Affiliate link injection utility

---

## Phase 4 — White-Label & Multi-Tenant

Make this a platform others can deploy.

- [ ] Multi-tenant: each tenant has their own `blog_id` namespace
- [ ] Custom domain support per tenant
- [ ] Tenant-specific AI prompts and source configs
- [ ] Billing integration (Stripe) — usage-based on posts generated
- [ ] Admin SaaS dashboard

---

## Tech Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | ISR, RSC, easy Vercel deploy |
| DB | PostgreSQL (Neon) | Array columns for tags/keywords, full-text search |
| ORM | Drizzle | Lightweight, type-safe, great migration story |
| Content | MDX via next-mdx-remote | Rich components in AI-generated markdown |
| Styling | Tailwind v4 | Dark-mode-first, zero JS |
| AI | Claude (Anthropic) | Best-in-class long-form writing |
| Automation | n8n → native pipelines | Start external, move in-house as scope grows |

---

## Contributing

Start with Phase 1 tasks. Each item is independently shippable — pick one, open a PR.
