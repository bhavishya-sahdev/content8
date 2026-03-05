# Docker

Run content8 as a standalone container alongside your existing stack.

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

content8 is now at `http://localhost:3001`.

## With your existing docker-compose

Add the `content8` service to your existing `docker-compose.yml`:

```yaml
services:
  # ... your existing services ...

  content8:
    image: ghcr.io/bhavishyasahdev/content8:latest
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
docker build -t content8 .
docker run -p 3001:3000 --env-file .env content8
```

## Subdomain vs subdirectory

| Setup                                 | SEO impact                          | Effort                  |
| ------------------------------------- | ----------------------------------- | ----------------------- |
| `blog.yourproject.com` (subdomain)    | Separate domain authority           | Lowest — just point DNS |
| `yourproject.com/blog` (subdirectory) | Shares your main domain authority ✓ | Add nginx/Caddy proxy   |

For SEO, **subdirectory is better**. Use the nginx or Caddy examples to proxy `/blog` from your main domain to the content8 container.
