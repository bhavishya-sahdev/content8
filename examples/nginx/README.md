# Nginx Reverse Proxy

Serves both your main app and content8 from the same domain using nginx.

## Setup

1. Deploy content8 (see [docker example](../docker/)) or run it separately on port 3001.

2. Update `nginx.conf`:
   - Replace `yourproject.com` with your domain.
   - Replace `main-app:3000` with your main app's host:port.
   - Replace `content8:3000` with content8's host:port.

3. Place in `/etc/nginx/sites-available/yourproject.com` and enable:
   ```bash
   ln -s /etc/nginx/sites-available/yourproject.com /etc/nginx/sites-enabled/
   nginx -t && nginx -s reload
   ```

## With HTTPS (certbot)

```bash
certbot --nginx -d yourproject.com
```

Certbot will modify the config to add SSL automatically.

## Asset routing

These examples reserve `/_next/*` for content8. If your main app is also Next.js, use the embedded CLI integration or a dedicated blog subdomain instead to avoid asset collisions. Set the production database and public site environment variables and run migrations before publishing.
