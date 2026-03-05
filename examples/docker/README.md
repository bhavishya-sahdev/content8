# Docker

Run auto-blog as a standalone container alongside your existing stack.

## Standalone (any stack)

```bash
# 1. Create .env
cat > .env <<EOF
DATABASE_URL=postgresql://user:password@your-db-host/dbname?sslmode=require
DATABASE_SSL=true
NEXT_PUBLIC_SITE_URL=https://blog.yourproject.com
NEXT_PUBLIC_SITE_NAME=Your Blog
WEBHOOK_SECRET=your-secret-here
EOF

# 2. Run
docker compose up -d
```

auto-blog is now at `http://localhost:3001`.

## With your existing docker-compose

Add the `auto-blog` service to your existing `docker-compose.yml`:

```yaml
services:
  # ... your existing services ...

  auto-blog:
    image: ghcr.io/bhavishyasahdev/auto-blog:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      DATABASE_SSL: "true"
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
      NEXT_PUBLIC_SITE_NAME: ${NEXT_PUBLIC_SITE_NAME}
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
```

Then add `/blog` routing in your nginx or Caddy config — see [`../nginx/`](../nginx/) or [`../caddy/`](../caddy/).

## Building locally

```bash
docker build -t auto-blog .
docker run -p 3001:3000 --env-file .env auto-blog
```

## Subdomain vs subdirectory

| Setup | SEO impact | Effort |
|---|---|---|
| `blog.yourproject.com` (subdomain) | Separate domain authority | Lowest — just point DNS |
| `yourproject.com/blog` (subdirectory) | Shares your main domain authority ✓ | Add nginx/Caddy proxy |

For SEO, **subdirectory is better**. Use the nginx or Caddy examples to proxy `/blog` from your main domain to the auto-blog container.
