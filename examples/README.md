# Integration Examples

Pick the path that matches your stack.

## Which integration should I use?

```
Do you have an existing Next.js project?
├── YES → npx content8@latest init         (copies routes into your project)
└── NO  → Deploy content8 standalone, then:
          ├── Hosted on Vercel?  → examples/vercel/
          ├── Self-hosted?
          │   ├── Using Caddy?   → examples/caddy/    (easiest, auto-HTTPS)
          │   └── Using Nginx?   → examples/nginx/
          └── Docker?            → examples/docker/
```

## Subdomain vs Subdirectory

|                    | `blog.yourproject.com`    | `yourproject.com/blog`    |
| ------------------ | ------------------------- | ------------------------- |
| **Setup effort**   | Low — just DNS            | Slightly more — add proxy |
| **SEO**            | Separate domain authority | Shares your main domain ✓ |
| **Recommendation** | Fine for starters         | Better for SEO long-term  |

For maximum SEO benefit, use the **subdirectory** approach with a reverse proxy (nginx, Caddy, or Vercel rewrites).

## Folders

| Folder               | When to use                                      |
| -------------------- | ------------------------------------------------ |
| [`vercel/`](vercel/) | Main app on Vercel — one-line rewrite config     |
| [`nginx/`](nginx/)   | Self-hosted with nginx                           |
| [`caddy/`](caddy/)   | Self-hosted with Caddy (auto-HTTPS, recommended) |
| [`docker/`](docker/) | Running content8 as a Docker container           |
