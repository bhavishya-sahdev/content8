import { db } from "@/db";
import schema from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  // Optional webhook secret validation
  const secret = req.headers.get("x-webhook-secret");
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return Response.json({ status: "unauthorized" }, { status: 401 });
  }

  let body = {
    data: {
      meta: {
        title: "",
        description: "",
        category: "",
        keywords: [] as string[],
        slug: "",
        tags: [] as string[],
        featuredImage: "",
      },
      content: "",
    },
  };

  try {
    body = await req.json();
  } catch {
    console.error("Failed to parse request body");
    return Response.json({ status: "bad", error: "Invalid JSON" }, { status: 400 });
  }

  const insertQuery = db
    .insert(schema.posts)
    .values({
      title: body.data.meta.title,
      description: body.data.meta.description,
      category: body.data.meta.category,
      keywords: body.data.meta.keywords,
      content: body.data.content,
      slug: body.data.meta.slug,
      tags: body.data.meta.tags,
      featuredImage: body.data.meta.featuredImage,
    })
    .onConflictDoNothing();

  try {
    await insertQuery.execute();
    revalidatePath("/blog");
    return Response.json({ status: "ok" });
  } catch (e) {
    console.error("Failed to insert post:", e);
    return Response.json({ status: "bad" }, { status: 500 });
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
  } catch (e) {
    console.error("Failed to get posts:", e);
    return Response.json({ status: "bad" }, { status: 500 });
  }
}
