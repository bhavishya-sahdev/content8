# auto-blog — Roadmap

> Target: developers with projects who want organic traffic and AI discoverability without becoming content marketers.

**Core loop:** project context → AI writes about it → posts auto-publish → Google + AI assistants find it.

---

## Phase 0 — Baseline ✓ (Done)

Extracted automated blog feature from portfolio-v4 into a standalone, open-sourceable repo.

- [x] Next.js 15 App Router + TypeScript + Tailwind v4
- [x] PostgreSQL schema (`posts` table) + Drizzle ORM + migrations
- [x] `POST /api/blog` — webhook endpoint with optional secret validation
- [x] `GET /api/blog` — latest posts (no content body)
- [x] `/blog` — listing page (featured post + card grid, ISR 1h)
- [x] `/blog/[slug]` — MDX post page (syntax highlighting, related posts, SEO meta)
- [x] MDX sanitizer — handles escaped chars, malformed tables, JSX conflicts from AI output
- [x] RSS feed — `/blog/rss.xml` (50 posts, 1h cache)
- [x] SEO utilities — Open Graph, Twitter cards, JSON-LD structured data
- [x] XML sitemap — `/blog/sitemap.xml`
- [x] All personal info replaced with env vars — generic for any deployer
- [x] README + ROADMAP targeting dev-project SEO use case

---

## Phase 1 — Developer-Project Aware

Make the engine understand *what project it's serving* so content is targeted, not generic.

### 1.1 Project Context

The key insight: AI-generated content must be grounded in *your* project to rank for your project's keywords and get recommended by AI assistants.

- [ ] `project.config.ts` — project identity file (name, URL, description, tech stack, target keywords, GitHub URL, competitors list)
- [ ] Inject project context into a `/api/blog` system prompt endpoint — n8n/pipelines can fetch this to prime their AI agent
- [ ] `author` field defaulted from project config, not hardcoded
- [ ] Category seed list in config — guides the AI on what content types to generate

### 1.2 `llms.txt` — AI Discoverability

The emerging standard ([llmstxt.org](https://llmstxt.org)). Generates an AI-readable index of your project that Perplexity, ChatGPT, and Claude can ingest when users ask about tools in your space.

- [ ] `GET /llms.txt` — auto-generated from posts, project config, and site metadata
  ```
  # MyTool
  > One-line description from project config

  ## Docs
  - [Getting started](...)

  ## Tutorials
  - [Recent post title](...)

  ## Comparisons
  - [MyTool vs X](...)
  ```
- [ ] `GET /llms-full.txt` — same but with post descriptions included (for deeper AI ingestion)
- [ ] Both revalidate on new post publication

### 1.3 Structured Data for AEO

Answer Engine Optimization — makes your content land in AI Overviews and featured snippets.

- [ ] `SoftwareApplication` JSON-LD schema in site `<head>` (from project config)
- [ ] `FAQPage` JSON-LD on posts that include a `## FAQ` section
- [ ] `HowTo` JSON-LD on tutorial-category posts
- [ ] `BreadcrumbList` on all post pages

### 1.4 Webhook Hardening

- [ ] Zod validation on `POST /api/blog` payload — reject malformed posts early with clear errors
- [ ] `draft` status field on `posts` table — queue posts without publishing
- [ ] `published_at` override — accept a future timestamp to schedule posts
- [ ] Idempotency key support — retry-safe ingestion from n8n

---

## Phase 2 — GitHub-Native Content Sources

Pull content directly from your project's GitHub activity so the pipeline has real, accurate context.

### 2.1 GitHub Integration

- [ ] GitHub App / OAuth — connect a repo to auto-blog
- [ ] **Releases → posts**: new GitHub release triggers a "What's new in v{version}" post
- [ ] **README as context source**: `/api/context/github` fetches and caches your repo's README for AI pipelines to reference
- [ ] **Issue labels as content signals**: issues tagged `blog-idea` feed into a content queue

### 2.2 Built-in Content Queue

- [ ] `content_queue` table — staged post ideas before AI expansion
- [ ] Admin UI to view, approve, reject queued ideas
- [ ] Priority field — bump important posts

### 2.3 Changelog Automation

- [ ] Parse `CHANGELOG.md` from GitHub — convert each version entry into a scheduled blog post
- [ ] Detect semver bump type (major/minor/patch) and adjust post length accordingly
- [ ] Tag changelog posts automatically

---

## Phase 3 — Content Strategy Engine

Move from "publish AI content" to "publish strategically targeted AI content."

### 3.1 Content Type Templates

High-converting content types for developer tools, built as structured prompt templates:

- [ ] **Comparison posts** — "MyTool vs {Competitor}" — pulls from competitors list in project config
- [ ] **Use-case posts** — "How {persona} uses MyTool to {outcome}"
- [ ] **Tutorial posts** — "How to do {X} with MyTool" — sourced from docs/README sections
- [ ] **Integration posts** — "Using MyTool with {popular tool}"
- [ ] Template management UI — customize prompts per content type

### 3.2 Keyword Targeting

- [ ] `target_keywords` array in project config
- [ ] Each generated post tagged with its primary keyword
- [ ] Keyword coverage dashboard — which terms are covered, which are missing
- [ ] Prevent keyword cannibalization — warn when two posts target the same keyword

### 3.3 Native AI Writer

Reduce dependency on n8n by building the AI writer into auto-blog itself:

- [ ] `POST /api/generate` — accepts content type + context, returns a draft post using **Claude (`claude-sonnet-4-6`)**
- [ ] Configurable prompt templates per content type
- [ ] Content quality scorer — auto-discard posts below a confidence threshold
- [ ] Cron-triggered generation — fully automated, zero manual intervention

---

## Phase 4 — Distribution & Analytics

Turn traffic into a feedback loop.

### 4.1 Analytics

Privacy-first, no cookies, no third-party scripts:

- [ ] `post_views` table — server-side view counter (increment on page load)
- [ ] `/admin/analytics` — top posts by views, posts per day, category breakdown, keyword coverage
- [ ] Trending posts widget on listing page (by views in last 7 days)
- [ ] Posts published vs organic traffic chart (link to Google Search Console API)

### 4.2 Email Newsletter

- [ ] `subscribers` table + signup form on blog listing page
- [ ] Weekly digest — top 5 posts — sent via **Resend**
- [ ] Unsubscribe flow with signed token
- [ ] Welcome email with project intro on subscribe
- [ ] Admin UI to view subscriber count + digest preview

### 4.3 Social Distribution

- [ ] Auto-post to X/Twitter on publish (via API)
- [ ] Auto-post to LinkedIn on publish
- [ ] Generate share image per post (`@vercel/og`)

---

## Tech Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | ISR, RSC, Vercel one-click deploy |
| DB | PostgreSQL (Neon) | Arrays for tags/keywords, full-text search path |
| ORM | Drizzle | Lightweight, type-safe, great migration story |
| Content | MDX via `next-mdx-remote` | AI output renders rich components cleanly |
| Styling | Tailwind v4 | Dark-first, zero JS |
| AI Writer | Claude `claude-sonnet-4-6` | Best-in-class technical long-form |
| Email | Resend | Developer-friendly, generous free tier |
| OG Images | `@vercel/og` | Zero-dependency, edge-rendered |
| Auth (admin) | TBD — better-auth or Clerk |  |

---

## Content Types That Win for Dev Tools

Ordered by conversion rate (source: developer SEO research):

1. **Comparison posts** — "X vs Y" captures bottom-funnel, high-intent traffic
2. **Use-case posts** — "How [persona] uses [tool]" — broad top-of-funnel
3. **Tutorial posts** — drives signups when the tutorial is about your tool specifically
4. **Changelog posts** — keep existing users and show velocity to prospects
5. **Integration posts** — captures search traffic from adjacent tools' user bases

---

## Contributing

Start with any unchecked Phase 1 item — each is independently shippable.

1. Fork + clone
2. `cp .env.example .env` — fill in a Neon free-tier `DATABASE_URL`
3. `bun run db:migrate && bun run dev`
4. Pick a task, open a PR against `main`
