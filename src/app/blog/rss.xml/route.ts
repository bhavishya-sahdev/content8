import RSS from "rss";
import { db } from "@/db";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Auto Blog";

async function getBlogs() {
  try {
    return await db.query.posts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
      limit: 50,
    });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const posts = await getBlogs();

    const feed = new RSS({
      title: SITE_NAME,
      description: "An automated technical blog powered by AI.",
      feed_url: `${SITE_URL}/blog/rss.xml`,
      site_url: SITE_URL,
      language: "en-us",
      categories: ["Technology", "Web Development", "AI", "Programming"],
      pubDate: posts.length > 0 ? new Date(posts[0].publishedAt) : new Date(),
      ttl: 60,
    });

    posts.forEach((post) => {
      const postUrl = `${SITE_URL}/blog/${post.slug}`;
      feed.item({
        title: post.title,
        description: post.description || "",
        url: postUrl,
        guid: postUrl,
        categories: [...(post.category ? [post.category] : []), ...(post.tags || [])],
        author: post.author || "Author",
        date: new Date(post.publishedAt),
        enclosure: post.featuredImage
          ? { url: post.featuredImage, type: "image/jpeg" }
          : undefined,
      });
    });

    return new Response(feed.xml({ indent: true }), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new Response("Error generating RSS feed", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
