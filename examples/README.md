# Integration examples

For an existing Next.js App Router project, use the local CLI described in the [main README](../README.md). This shares the host app's navigation and assets.

For another stack, deploy content8 separately:

- [Docker](docker/): build and run the included container with an existing PostgreSQL database.
- [Vercel](vercel/): example reverse-proxy rewrites.
- [Nginx](nginx/) and [Caddy](caddy/): example proxy configurations.

A dedicated subdomain is the simplest standalone setup. A `/blog` proxy needs to route the blog's Next.js assets as well as its page and webhook requests. The included proxy configs reserve `/_next/*` for content8, so use the embedded integration if the main app is also Next.js. Set `NEXT_PUBLIC_SITE_URL` to the public origin readers use. Neither deployment arrangement guarantees search rankings.
