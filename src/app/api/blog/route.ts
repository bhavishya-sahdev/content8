import { db } from "@/db";
import schema from "@/db/schema";
import { revalidatePath } from "next/cache";
import { parseBlogPayload } from "@/lib/blogPayload";

export async function POST(req: Request) {
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (!expectedSecret) {
    return Response.json({ status: "error", error: "Publishing is disabled until WEBHOOK_SECRET is configured." }, { status: 503 });
  }
  if (req.headers.get("x-webhook-secret") !== expectedSecret) {
    return Response.json({ status: "unauthorized" }, { status: 401 });
  }

  let post: ReturnType<typeof parseBlogPayload>;
  try {
    post = parseBlogPayload(await req.json());
  } catch (error) {
    return Response.json({ status: "error", error: error instanceof Error ? error.message : "Invalid request body." }, { status: 400 });
  }

  try {
    const [saved] = await db.insert(schema.posts).values(post)
      .onConflictDoUpdate({ target: schema.posts.slug, set: post })
      .returning({ id: schema.posts.id, slug: schema.posts.slug });
    revalidatePath("/blog");
    revalidatePath(`/blog/${saved.slug}`);
    revalidatePath("/blog/sitemap.xml");
    revalidatePath("/blog/rss.xml");
    return Response.json({ status: "ok", data: { ...saved, path: `/blog/${saved.slug}` } });
  } catch (error) {
    console.error("Failed to publish post:", error);
    return Response.json({ status: "error", error: "Could not save the article. Check the database connection and migrations." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const posts = await db.query.posts.findMany({
      limit: 10,
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
      columns: { content: false },
    });
    return Response.json({ status: "ok", data: posts });
  } catch (error) {
    console.error("Failed to get posts:", error);
    return Response.json({ status: "error" }, { status: 500 });
  }
}
