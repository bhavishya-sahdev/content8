# Caddy Reverse Proxy

Caddy handles HTTPS automatically (Let's Encrypt). This is the simplest self-hosted option.

## Setup

1. Replace `yourproject.com` with your domain.
2. Replace `main-app:3000` and `auto-blog:3000` with your service host:port values.
3. Run Caddy:

```bash
caddy run --config Caddyfile
```

Caddy will obtain and renew TLS certificates automatically.

## With Docker Compose

See [`../docker/docker-compose.yml`](../docker/docker-compose.yml) for a complete stack example including Caddy.
