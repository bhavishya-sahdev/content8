# content8

**Publish from n8n to your Next.js blog, on your own domain.**

Content8 is a self-hosted publishing endpoint and blog. Send an article from n8n, a script, or another workflow; content8 stores it in PostgreSQL and renders it at `/blog/[slug]` with canonical URLs, social metadata, JSON-LD, a sitemap, and RSS.

It is for developers who already have a content workflow and want to own their publishing layer. You bring the articles and editorial review. Content8 does not generate articles, select keywords, or guarantee traffic or AI recommendations.

## Get your first article online locally

Requires Node.js 22, Bun, and a new PostgreSQL database. Have your database connection URL ready; setup does not provision a database or create a provider account.

```bash
git clone https://github.com/bhavishya-sahdev/content8.git
cd content8
bun install --frozen-lockfile
bun run setup
bun run dev
```

Setup asks for your database URL, blog name, and site origin (default: `http://localhost:3000`). It then:

1. Saves `.env` and generates a publishing secret.
2. Checks the database connection and applies the included migrations.
3. Creates a sample article if the blog is empty and prints the URL to open.

There is no manual environment-file editing, migration generation, or curl request needed for the first article. Existing configuration is reused, and existing articles are left alone. If a connection fails, fix the saved settings and rerun `bun run setup`.

For automated setup, provide `DATABASE_URL` in your environment and run `bun run setup --yes`. Local databases default to no TLS; remote databases default to TLS. An explicit `DATABASE_SSL` setting takes precedence.

### Publish your own article

With the server running, edit [examples/first-post.json](examples/first-post.json), then run:

```bash
bun run publish -- examples/first-post.json
```

The command validates the file, reads your secret from the environment, and prints the published URL. Keep the slug to update an article; change it to create another. It targets localhost by default, even if your configured site origin is a production URL.

To publish to a deployed server, use its matching `WEBHOOK_SECRET` and an explicit HTTPS origin:

```bash
bun run publish -- examples/first-post.json --url https://blog.example.com
```

Both commands support `--help`. You can still configure `.env` manually using [.env.example](.env.example), run `bun run db:migrate`, and call the webhook directly.

## How publishing works

```text
Your reviewed article → POST /api/blog → PostgreSQL → /blog/[slug]
                                                   → /blog/sitemap.xml
                                                   → /blog/rss.xml
```

`POST /api/blog` creates or replaces an article by slug. Repeating a request never creates a second article with that slug. Updates preserve the ID and original publication date. This is a full replacement of the editable fields, not a partial patch; omitted optional fields reset to their defaults.

```json
{
  "data": {
    "meta": {
      "title": "How to publish from n8n",
      "description": "Send a reviewed article to your own Next.js blog.",
      "category": "Tutorials",
      "slug": "publish-from-n8n",
      "author": "Your name",
      "tags": ["n8n", "nextjs"],
      "keywords": [],
      "featuredImage": "https://your-site.com/article-image.jpg"
    },
    "content": "## Prerequisites\n\nStart with a reviewed article."
  }
}
```

Required: `title` (up to 256 characters), `description` (2,000), `category` (100), `slug` (200), and `content` (500,000). Slugs use lowercase letters, numbers, and single hyphens between words. The other fields are optional. Use headings starting at `##` in the body because the page renders the title as its main heading.

| Response | Meaning |
| --- | --- |
| `200` | Article saved; `data.path` contains the relative article URL |
| `400` | Invalid JSON or fields; `error` explains the problem |
| `401` | Missing or incorrect shared secret |
| `503` | The server has no `WEBHOOK_SECRET` configured |
| `500` | Saving failed; check database configuration and migrations |

The secret is sent in the `x-webhook-secret` header. This is shared-secret authentication, not HMAC signing. Use HTTPS outside local development. Only trusted editors or workflows should publish: the renderer supports MDX, which can execute JavaScript. Do not expose it as an untrusted user-content endpoint.

`GET /api/blog` returns the latest ten articles without their content bodies.

## Connect n8n

After publishing the sample locally, add an **HTTP Request** node to your workflow:

| Setting | Value |
| --- | --- |
| Method | `POST` |
| URL | `https://your-site.com/api/blog` |
| Authentication | Generic Credential Type → Header Auth |
| Credential header | `x-webhook-secret` with your server's secret |
| Send Body | On |
| Body Content Type | JSON |
| JSON body | `{{ $json }}` when the incoming item matches the payload above |

Store the secret in n8n credentials. Review generated content before this node runs. Reuse the slug to publish corrections. Content8 currently has no built-in drafting, approval, scheduling, or deletion interface.

## Add to an existing Next.js app

The embedded integration requires the App Router, TypeScript, PostgreSQL, and configured Tailwind CSS (the standalone app uses v4). Imports assume `@/*` points to `./src/*` or `./*`, matching your layout.

From a local clone, run this inside your app:

```bash
node /absolute/path/to/content8/bin/init.mjs init
```

The CLI copies blog routes and helpers, installs missing dependencies using content8's declared versions, creates a Drizzle config if absent, and adds missing migration scripts. Existing files and scripts are preserved. Review any reported conflicts before running your app.

- If you already use Drizzle, ensure your database exports and schema match the copied imports.
- Configure `.env`, generate and apply migrations, then publish the sample with the webhook payload below.
- Replace `BlogHeader.tsx` with your navigation.
- Ensure Tailwind is configured and loaded in your app's root layout.
- Follow the CLI's Next.js configuration guidance for MDX and syntax highlighting.

For scripted setup, `--yes` accepts defaults and `--skip-install` copies files without installing dependencies. Package publication is separate from cloning this repository; the local command above does not depend on an npm release.

## Deploy

Run `bun run build` and `bun run start` on a Node.js host with the environment below. Generate and apply database migrations before serving articles. Build with your production `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SITE_NAME` values.

For a different frontend stack, deploy content8 separately and proxy `/blog/*` to it. See [Vercel](examples/vercel/README.md), [Nginx](examples/nginx/README.md), and [Caddy](examples/caddy/README.md) examples. Proxy `/_next/*` too when needed by your hosting arrangement; avoid collisions with another Next.js app's assets. A dedicated subdomain avoids that routing concern. Set the site URL to the public origin readers use.

Docker instructions are in [examples/docker](examples/docker/README.md). The repository builds its own image; no prepublished container image is required.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Required PostgreSQL connection string |
| `DATABASE_SSL` | `false` for local PostgreSQL; `true` when TLS is required |
| `NEXT_PUBLIC_SITE_URL` | Public origin used in canonical URLs, sitemap, RSS, and metadata |
| `NEXT_PUBLIC_SITE_NAME` | Blog name; defaults to Content8 |
| `WEBHOOK_SECRET` | Required for publishing; keep it on the server and in workflow credentials |

## Scope and development

Implemented: publishing and replacement by slug, MDX rendering, related posts by category, metadata, JSON-LD, canonical URLs, sitemap, RSS, and the embedded installer.

Not implemented: article generation, an importable generation/approval workflow, analytics, draft management, `llms.txt`, or `llms-full.txt`. Search performance depends on your content and distribution, not simply these metadata features.

```bash
bun test
bun run typecheck
bun run build
```

[MIT licensed](LICENSE). Contributions should include a reproducible example and relevant checks.
