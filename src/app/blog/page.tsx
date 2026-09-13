import BlogHeader from "@/components/BlogHeader";
import { db } from "@/db";
import { Metadata } from "next";
import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Content8";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Blog`,
  description: "An automated technical blog powered by AI.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

async function getBlogs() {
  try {
    const res = await db.query.posts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
    });
    return {
      data: res.map((post) => ({
        ...post,
        readTime: Math.ceil((post.content?.trim().split(" ").length || 0) / 230),
        content: undefined,
      })),
    };
  } catch (e) {
    console.error("Failed to get blogs:", e);
    return { data: [] };
  }
}

const navItems = [
  { href: "/blog", label: "Blog" },
  { href: "/blog/rss.xml", label: "RSS" },
];

export default async function BlogPage() {
  const { data: blogs } = await getBlogs();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <BlogHeader items={navItems} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
        <header className="mb-14">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">{SITE_NAME}</h1>
          <p className="mt-3 text-zinc-400">
            Automated technical articles, updated continuously.
          </p>
        </header>

        {blogs.length === 0 ? (
          <div className="py-24 text-center text-zinc-500">
            <p>No posts yet.</p>
            <p className="mt-2 text-sm">
              Send a POST request to{" "}
              <code className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">/api/blog</code>{" "}
              to publish the first article.
            </p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            <article className="mb-16 pb-16 border-b border-zinc-800">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-medium px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded-full">
                  {blogs[0].category}
                </span>
                {blogs[0].tags?.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-zinc-800/60 text-zinc-500 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-3xl font-bold text-zinc-100 mb-3 leading-snug">
                <Link href={`/blog/${blogs[0].slug}`} className="hover:text-zinc-300 transition-colors">
                  {blogs[0].title}
                </Link>
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed mb-5 max-w-2xl">
                {blogs[0].description}
              </p>

              <div className="flex items-center gap-4 text-sm text-zinc-500 mb-6">
                <span className="font-medium text-zinc-400">{blogs[0].author}</span>
                <span>·</span>
                <time dateTime={blogs[0].publishedAt || ""}>
                  {new Date(blogs[0].publishedAt || "").toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <span>·</span>
                <span>{blogs[0].readTime} min read</span>
              </div>

              <Link
                href={`/blog/${blogs[0].slug}`}
                className="inline-flex items-center px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-md hover:bg-white transition-colors"
              >
                Read article
                <svg className="ml-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </article>

            {/* Post grid */}
            {blogs.length > 1 && (
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {blogs.slice(1).map((blog) => (
                  <article key={blog.id} className="group border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
                        {blog.category}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-zinc-100 mb-2 leading-snug line-clamp-2">
                      <Link href={`/blog/${blog.slug}`} className="group-hover:text-zinc-300 transition-colors">
                        {blog.title}
                      </Link>
                    </h3>

                    <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 mb-4">
                      {blog.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span className="font-medium text-zinc-500">{blog.author}</span>
                      <span>·</span>
                      <time dateTime={blog.publishedAt || ""}>
                        {new Date(blog.publishedAt || "").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                      <span>·</span>
                      <span>{blog.readTime} min</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}
