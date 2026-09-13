# Docker

From the repository root, create `.env` from `.env.example`. Set the PostgreSQL URL, SSL setting, public site origin/name, and publishing secret. The database must be reachable from the container (`localhost` inside a container is not your host).

Prepare the database using the local development tools:

```bash
bun install --frozen-lockfile
bun run db:generate
bun run db:migrate
```

Build and start the included image:

```bash
docker compose --env-file .env -f examples/docker/docker-compose.yml up --build -d
```

Visit `http://localhost:3001/blog`. Send the sample request from the main README to port 3001 to publish your first article. Set `NEXT_PUBLIC_SITE_URL` to your externally reachable origin. Rebuild after changing the public origin or name because Next.js embeds public environment values at build time.

This configuration uses an existing PostgreSQL database and a locally built image. Use an HTTPS reverse proxy for public deployments.
