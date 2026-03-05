# Vercel Reverse Proxy

Serve content8 from `/blog` on your **main app's domain** without touching your existing deployment.

## Setup

1. Deploy content8 to Vercel (separate project):

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bhavishyasahdev/content8)

2. Copy `vercel.json` to your **main project root**.

3. Replace `YOUR-AUTO-BLOG.vercel.app` with your content8 deployment URL.

4. Push — Vercel picks up the rewrites automatically.

Your main app is now at `yourproject.com` and the blog at `yourproject.com/blog`.

## Why this works

Vercel rewrites proxy the request server-side, so the user sees `yourproject.com/blog` in the URL bar. SEO authority stays on your main domain.

## Notes

- The `/api/blog` rewrite lets your n8n pipeline POST to `yourproject.com/api/blog` instead of the content8 URL directly.
- If your main app already has `/api/blog` routes, remove that rewrite and point n8n directly at the content8 URL.
