# Caddy Reverse Proxy

Caddy handles HTTPS automatically (Let's Encrypt). This is the simplest self-hosted option.

## Setup

1. Replace `yourproject.com` with your domain.
2. Replace `main-app:3000` and `content8:3000` with your service host:port values.
3. Run Caddy:

```bash
caddy run --config Caddyfile
```

Caddy will obtain and renew TLS certificates automatically.

## With Docker Compose

See [`../docker/docker-compose.yml`](../docker/docker-compose.yml) to build the content8 service. Run Caddy separately on a network that can reach it.

## Asset routing

These examples reserve `/_next/*` for content8. If your main app is also Next.js, use the embedded CLI integration or a dedicated blog subdomain instead to avoid asset collisions. Set the production database and public site environment variables and run migrations before publishing.
