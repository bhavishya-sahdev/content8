/**
 * Seed script — populates the database with example posts.
 *
 * Run: bun run db:seed
 *
 * These posts demonstrate all four content categories and exercise every
 * MDX component (headings, code blocks, callouts, tables, lists, blockquotes).
 * Delete or replace them once you start publishing real content.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { posts } from "../src/db/schema/posts";
const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL || "",
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : process.env.NODE_ENV === "production" ||
          process.env.DATABASE_SSL === "true",
  },
});

const examplePosts = [
  // ─── Tutorial ──────────────────────────────────────────────────────────────
  {
    title: "How to Auto-Publish SEO Blog Posts Using n8n and content8",
    description:
      "A step-by-step guide to wiring up an n8n workflow that reads your project docs and ships a new SEO article every week — fully automated.",
    slug: "auto-publish-seo-posts-n8n",
    author: "content8",
    category: "Tutorials",
    tags: ["n8n", "automation", "seo", "nextjs"],
    keywords: [
      "automated blog posts",
      "n8n blog automation",
      "seo for developer tools",
    ],
    content: `# How to Auto-Publish SEO Blog Posts Using n8n and content8

Most developer tools never get found — not because they're bad, but because nobody wrote about them. This guide fixes that with a one-time n8n setup that publishes a fresh SEO article every week, automatically.

## What you'll build

By the end of this tutorial you'll have:

- An n8n workflow that runs on a weekly schedule
- A Claude prompt that generates a targeted article about your project
- A webhook call to content8 that publishes the post and updates your sitemap

<Callout type="info">
You'll need an n8n instance (cloud or self-hosted), an Anthropic API key, and content8 deployed with a \`WEBHOOK_SECRET\` set.
</Callout>

## Step 1 — Set up your n8n workflow

Create a new workflow in n8n and add these nodes in order:

1. **Schedule Trigger** — run weekly on Monday at 09:00
2. **HTTP Request** — fetch your project's README from GitHub
3. **AI Agent** — generate the article
4. **HTTP Request** — POST to your content8 webhook

### Fetching your README

Configure the first HTTP Request node:

\`\`\`json
{
  "method": "GET",
  "url": "https://raw.githubusercontent.com/you/your-project/main/README.md"
}
\`\`\`

The response body is your project context. Pass it to the AI Agent as \`{{ $json.body }}\`.

## Step 2 — Write the AI prompt

In the AI Agent node, use this system prompt. Replace the bracketed values with your project's specifics:

\`\`\`text
You are a technical content writer specialising in developer tools.
Write a blog post about [YOUR PROJECT NAME].

Context about the project:
{{ $json.body }}

Article type: Tutorial
Target keyword: [keyword you want to rank for]
Word count: 800–1200 words

Output format — valid JSON only, no markdown fences:
{
  "data": {
    "meta": {
      "title": "...",
      "description": "...",
      "category": "Tutorials",
      "slug": "...",
      "tags": ["...", "..."],
      "keywords": ["...", "..."]
    },
    "content": "# ...\\n\\n..."
  }
}
\`\`\`

<Callout type="warning">
Ask for JSON output explicitly. Some models wrap it in markdown code fences — add a post-processing step to strip them if needed.
</Callout>

## Step 3 — POST to the webhook

Add a second HTTP Request node after the AI Agent:

| Field | Value |
|---|---|
| Method | POST |
| URL | \`https://your-blog.com/api/blog\` |
| Header | \`x-webhook-secret: your-secret\` |
| Content-Type | \`application/json\` |
| Body | \`{{ $json.output }}\` |

## Step 4 — Test it

Trigger the workflow manually once. You should see:

\`\`\`bash
# Webhook response
{ "status": "ok", "slug": "your-first-automated-post" }
\`\`\`

Visit \`/blog\` — your post should appear within a few seconds (ISR revalidates on insert).

## What to expect

After running for a month with one post per week:

- **4 indexed articles** targeting long-tail keywords
- **Automatic sitemap updates** — Google sees new content immediately
- **RSS feed** updated — newsletter subscribers get new posts

The compounding effect is the point. Each article is an additional surface for your project to be found.

---

The complete n8n workflow JSON is in \`examples/n8n/workflow.json\` in the content8 repository.
`,
  },

  // ─── Comparison ────────────────────────────────────────────────────────────
  {
    title:
      "content8 vs Ghost vs Hashnode: Best Blog for Developer Tools in 2025",
    description:
      "A direct comparison of content8, Ghost, and Hashnode for developer-tool makers who care about SEO, AI discoverability, and zero content overhead.",
    slug: "content8-vs-ghost-vs-hashnode",
    author: "content8",
    category: "Comparisons",
    tags: ["ghost", "hashnode", "blogging", "seo"],
    keywords: [
      "best blog platform for developers",
      "ghost vs hashnode",
      "automated blog for saas",
    ],
    content: `# content8 vs Ghost vs Hashnode: Best Blog for Developer Tools in 2025

If you're a developer-tool maker trying to pick a blog platform, the classic options — Ghost and Hashnode — were built for human writers. content8 was built for the opposite assumption: you won't write a single post yourself.

Here's how they compare across the dimensions that matter for developer tools.

## The core difference

> Ghost and Hashnode are publishing tools. content8 is a content pipeline.

The distinction sounds abstract until you try to maintain a blog alongside shipping software. Ghost requires you to open a CMS and write. Hashnode requires you to open a CMS and write. content8 requires you to deploy it once and then forget it exists.

## Feature comparison

| | content8 | Ghost | Hashnode |
|---|---|---|---|
| **Setup time** | ~5 min | 15–30 min | 2 min |
| **Hosting** | Self-hosted / Vercel | Self-hosted / Ghost Pro | Hashnode cloud |
| **Content entry** | Webhook (automated) | CMS editor | CMS editor |
| **MDX support** | Yes (full component support) | No | No |
| **llms.txt** | Yes (v0.2) | No | No |
| **JSON-LD structured data** | Yes | Partial | Partial |
| **RSS** | Yes | Yes | Yes |
| **XML sitemap** | Yes | Yes | Yes |
| **Custom domain** | Yes | Yes (paid) | Yes |
| **Price** | Free (OSS) | Free self-hosted / $9+ cloud | Free |
| **AI-generated content** | Native | Possible via plugins | Not native |

## When to use each

### Use content8 if…

- You want content published automatically from n8n, Make, or any AI pipeline
- Your project is on GitHub and you want tutorials/comparisons generated from your docs
- You care about \`llms.txt\` and AI-assistant discoverability
- You're already on Next.js (the \`npx content8 init\` path)

\`\`\`bash
# Get started in under 5 minutes
npx content8@latest init
\`\`\`

### Use Ghost if…

- You have a dedicated content team or solo writer
- You want a polished CMS UI with newsletter integration
- You're willing to pay for Ghost Pro or manage a VPS

### Use Hashnode if…

- You want zero ops — fully managed, free tier
- You don't need MDX or custom components
- You want a built-in developer community

## SEO implications

All three generate sitemaps and Open Graph tags. The meaningful difference is **structured data** and **content velocity**.

<Callout type="info">
Structured data (JSON-LD \`SoftwareApplication\`, \`FAQPage\`, \`HowTo\` schemas) is what makes your content eligible for AI Overviews in Google Search. content8 generates these automatically. Ghost and Hashnode do not.
</Callout>

Content velocity matters too. Ghost and Hashnode produce as many posts as you write — usually zero to one per month for a solo developer. content8 can publish four categorically different posts per week without any additional effort.

## Bottom line

If you're a developer who wants a blog to drive organic traffic **without becoming a content marketer**, content8 is the only option built for that workflow. Ghost and Hashnode are excellent tools — just for a different user.
`,
  },

  // ─── Use Case ──────────────────────────────────────────────────────────────
  {
    title:
      "How One Indie Hacker Got 3,000 Monthly Visitors Without Writing a Post",
    description:
      "A walkthrough of how a solo developer used content8 to generate comparison and tutorial posts that now drive consistent organic traffic to a developer tool.",
    slug: "indie-hacker-organic-traffic-content8",
    author: "content8",
    category: "Use Cases",
    tags: ["indie hacking", "seo", "organic traffic", "case study"],
    keywords: [
      "indie hacker seo",
      "automated content marketing",
      "developer tool organic traffic",
    ],
    content: `# How One Indie Hacker Got 3,000 Monthly Visitors Without Writing a Post

Karan built a PostgreSQL migration tool. It was good — faster than Flyway, simpler than Liquibase. He launched it on Hacker News, got 200 upvotes, then watched traffic fall back to zero over the next two weeks.

The product was fine. The discoverability wasn't.

## The problem

Karan's README was excellent. His docs were thorough. But none of that helps when someone types "postgres migration tool comparison" into Google and your site doesn't appear.

He had three options:

1. Write comparison posts, tutorials, and use-case articles himself (8–12 hours per post)
2. Hire a technical writer ($500–$2,000/month)
3. Automate it

He chose option 3.

## The setup

Karan deployed content8 as a subdirectory of his main domain using Vercel rewrites — so \`his-tool.dev/blog\` shared domain authority with his landing page.

\`\`\`json
// vercel.json on his main site
{
  "rewrites": [
    {
      "source": "/blog/:path*",
      "destination": "https://his-content8.vercel.app/blog/:path*"
    }
  ]
}
\`\`\`

Then he set up an n8n workflow with a weekly schedule. The workflow:

1. Fetches his README and CHANGELOG from GitHub
2. Picks a content type from a rotation: Comparison → Tutorial → Use Case → Changelog
3. Generates a targeted article with Claude, aiming at a specific keyword
4. POSTs to \`/api/blog\`

Total setup time: about 3 hours.

## The content strategy

Karan targeted keywords his users were already searching for:

- **"postgres migration tool"** — tutorial on running zero-downtime migrations
- **"flyway vs liquibase vs [his tool]"** — comparison with his tool highlighted
- **"django database migrations production"** — use case targeting Django developers
- **"automated schema migrations ci/cd"** — tutorial for DevOps engineers

<Callout type="success">
Comparison posts ("X vs Y") consistently outperform tutorials for early-stage developer tools. Users searching for comparisons are already in evaluation mode.
</Callout>

## The results (12 weeks in)

| Week | Posts published | Monthly visitors |
|---|---|---|
| 1 | 1 | 80 |
| 4 | 4 | 340 |
| 8 | 8 | 1,100 |
| 12 | 12 | 3,200 |

The spike at week 10 came from a comparison post ranking on page 1 for "flyway alternative postgres". That single post now accounts for ~40% of organic traffic.

## What he didn't do

- He never opened a CMS
- He never wrote a blog post
- He never hired a writer

He reviewed the auto-generated posts once a week to check for hallucinations and occasionally tweaked the keyword targeting in the n8n prompt.

## The compounding effect

The traffic numbers above look linear, but search engine rankings take time to build. By month 6, Karan expects the compound effect to accelerate: more posts → more backlinks → higher domain authority → better rankings for new posts.

The system keeps running whether he's shipping features or on vacation.

---

If you want to replicate this, the full n8n workflow template is in the content8 repository under \`examples/n8n/\`.
`,
  },

  // ─── Changelog ─────────────────────────────────────────────────────────────
  {
    title:
      "content8 v0.2 — LLMs.txt, JSON-LD Structured Data, and Project Config",
    description:
      "content8 v0.2 ships three Phase 1 features: an llms.txt endpoint for AI discoverability, SoftwareApplication and FAQPage structured data, and a project.config.ts for project identity.",
    slug: "content8-v0-2-changelog",
    author: "content8",
    category: "Changelog",
    tags: ["release", "llms.txt", "structured data", "changelog"],
    keywords: [
      "content8 changelog",
      "llms.txt implementation",
      "json-ld structured data nextjs",
    ],
    content: `# content8 v0.2 — LLMs.txt, JSON-LD Structured Data, and Project Config

v0.2 ships the three Phase 1 features from the roadmap. Each one is independently useful; together they make your blog significantly more discoverable to both search engines and AI assistants.

## What's new

### \`/llms.txt\` — AI discoverability

content8 now generates an \`llms.txt\` file at the root of your domain. This is the emerging standard for telling AI assistants (Perplexity, ChatGPT, Claude) what your project does and where to find more information.

\`\`\`
# YourTool

> One-line description of what your project does.

## Documentation
- [Getting started](/blog/getting-started)
- [How it works](/blog/how-it-works)

## Tutorials
- [Zero-downtime migrations](/blog/zero-downtime-migrations)

## Comparisons
- [YourTool vs Competitor](/blog/yourtool-vs-competitor)
\`\`\`

The file is generated dynamically from your published posts and the project identity config (see below). It revalidates hourly alongside your blog index.

<Callout type="info">
\`/llms-full.txt\` is also available — it includes post content, not just links. Useful for AI assistants that fetch and index the full file.
</Callout>

### JSON-LD structured data

Every blog post now includes \`SoftwareApplication\` and \`Article\` JSON-LD schemas in the \`<head>\`. Category-specific schemas are added automatically:

| Post category | JSON-LD schemas added |
|---|---|
| Tutorials | \`HowTo\` + \`Article\` |
| Comparisons | \`Article\` + \`ItemList\` |
| Use Cases | \`Article\` |
| Changelog | \`SoftwareApplication\` + \`Article\` |

This structured data is what makes your content eligible for **AI Overviews** in Google Search — the answer cards that appear above traditional results.

### \`project.config.ts\` — project identity

A new config file at the root of your project lets content8 generate smarter content and metadata:

\`\`\`typescript
// project.config.ts
export default {
  name: "YourTool",
  description: "One-line description for AI assistants and structured data.",
  url: "https://yourtool.dev",
  github: "https://github.com/you/your-tool",
  techStack: ["PostgreSQL", "Node.js", "TypeScript"],
  targetKeywords: [
    "postgres migration tool",
    "zero-downtime migrations",
  ],
  competitors: ["Flyway", "Liquibase"],
};
\`\`\`

This config is used by:

- The \`/llms.txt\` generator (project name, description)
- JSON-LD \`SoftwareApplication\` schema (name, url, description)
- The n8n prompt template (competitors, tech stack, target keywords)

## Upgrading from v0.1

If you used \`npx content8@latest init\` on v0.1, run it again — the CLI detects your existing files and only copies what's missing:

\`\`\`bash
npx content8@latest init
\`\`\`

Or manually:

1. Add \`project.config.ts\` to your project root
2. Copy \`src/app/llms.txt/route.ts\` and \`src/app/llms-full.txt/route.ts\`
3. Update \`src/lib/blogUtils.ts\` to import the new JSON-LD utilities

## What's next

Phase 2 targets GitHub-native features: auto-ingesting your \`CHANGELOG.md\`, generating release posts from GitHub releases, and a GitHub Action for zero-config setup.

See [ROADMAP.md](https://github.com/bhavishyasahdev/content8/blob/main/ROADMAP.md) for the full picture.
`,
  },
];

async function seed() {
  console.log(`Seeding ${examplePosts.length} example posts…\n`);

  for (const post of examplePosts) {
    try {
      await db.insert(posts).values(post).onConflictDoNothing();
      console.log(`  ✓ ${post.category.padEnd(12)} "${post.title}"`);
    } catch (err) {
      console.error(`  ✗ Failed: ${post.slug}`, err);
    }
  }

  console.log("\nDone. Visit /blog to see the posts.");
  process.exit(0);
}

seed();
