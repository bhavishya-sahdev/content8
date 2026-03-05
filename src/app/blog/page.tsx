import Navbar from "@/components/Navbar";
import { db } from "@/db";
import { Metadata } from "next";
import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Auto Blog";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Technical Insights`,
  description: "An automated technical blog powered by AI.",
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

async function getBlogs() {
  try {
    const res = await db.query.posts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
    });
    return {
      data: res.map((post) => ({
        ...post,
        readTime: Math.ceil(((post.content?.trim().split(" ").length || 0) / 230)),
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,107,107,0.1),transparent_50%)]" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-gray-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Navbar items={navItems} />

      {/* Hero */}
      <section className="relative container mx-auto pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-gray-400/20 bg-gray-400/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <div className="mr-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            AI-powered content, updated automatically
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            <span className="block text-white">{SITE_NAME}</span>
            <span className="block bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              Chronicles
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-xl leading-relaxed">
            Automated technical articles sourced from developer communities, refined by AI, delivered fresh.
          </p>
        </div>
      </section>

      {/* Content */}
      {blogs.length > 0 ? (
        <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* Featured Post */}
          <section className="mb-20">
            <div className="group relative overflow-hidden rounded-3xl bg-gray-900/30 border border-gray-800/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/50 to-transparent z-10" />

              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative z-20 p-8 lg:p-12 flex flex-col justify-center space-y-6">
                  <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs text-white w-fit">
                    Featured Post
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {blogs[0]?.tags?.map((tag, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-white/10 backdrop-blur-sm text-gray-200 rounded-full border border-white/20">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-3xl lg:text-4xl font-bold text-white">
                      <Link href={`/blog/${blogs[0]?.slug}`} className="hover:underline">
                        {blogs[0]?.title}
                      </Link>
                    </h2>

                    <p className="text-gray-300 text-lg leading-relaxed">{blogs[0]?.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-6">
                      <span className="font-medium text-gray-200">{blogs[0]?.author}</span>
                      <span>{blogs[0]?.readTime} min read</span>
                    </div>
                    <time dateTime={blogs[0]?.publishedAt || ""}>
                      {new Date(blogs[0]?.publishedAt || "").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <Link
                    href={`/blog/${blogs[0]?.slug}`}
                    className="inline-flex items-center px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-all duration-300 hover:scale-105 w-fit"
                  >
                    Read Full Article
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="relative overflow-hidden rounded-r-3xl lg:rounded-l-none">
                  <img
                    src={blogs[0]?.featuredImage || `https://placehold.co/600x400?text=${encodeURIComponent(blogs[0]?.title || "Featured")}`}
                    alt={blogs[0]?.title || "Featured post"}
                    className="w-full h-64 lg:h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* Recent Posts Grid */}
          {blogs.length > 1 && (
            <section>
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-bold text-white">Recent Posts</h3>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-gray-400">Updated automatically</span>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {blogs.slice(1).map((blog, index) => (
                  <article
                    key={blog.id}
                    className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/10"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-gray-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={blog?.featuredImage || `https://placehold.co/600x400?text=${encodeURIComponent(blog?.title || "Post")}`}
                        alt={blog?.title || "Post"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="text-xs px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full border border-white/20">
                          {blog.category}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 p-6 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {blog.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white/10 backdrop-blur-sm text-gray-300 rounded-full border border-white/10">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-xl font-semibold text-white group-hover:text-gray-200 transition-colors duration-300 line-clamp-2">
                        <Link href={`/blog/${blog.slug}`} className="hover:underline">
                          {blog.title}
                        </Link>
                      </h3>

                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{blog.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/50">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-gray-300">{blog.author}</span>
                          <span>{blog.readTime} min read</span>
                        </div>
                        <time dateTime={blog.publishedAt || ""}>
                          {new Date(blog.publishedAt || "").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      ) : (
        <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center">
          <div className="py-24 space-y-4">
            <p className="text-gray-400 text-lg">No posts yet.</p>
            <p className="text-gray-500 text-sm">
              Send a POST request to <code className="bg-gray-800 px-2 py-1 rounded">/api/blog</code> to publish the first article.
            </p>
          </div>
        </main>
      )}

      <footer className="relative border-t border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {SITE_NAME} — powered by AI & Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
