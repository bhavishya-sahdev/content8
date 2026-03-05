# Nginx Reverse Proxy

Serves both your main app and auto-blog from the same domain using nginx.

## Setup

1. Deploy auto-blog (see [docker example](../docker/)) or run it separately on port 3001.

2. Update `nginx.conf`:
   - Replace `yourproject.com` with your domain.
   - Replace `main-app:3000` with your main app's host:port.
   - Replace `auto-blog:3000` with auto-blog's host:port.

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
