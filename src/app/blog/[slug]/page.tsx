import { db } from "@/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ComponentPropsWithoutRef, ReactNode } from "react";
import { checkImageExists } from "@/lib/utils";
import { generateBlogPostMetadata, sanitizeMDXContent } from "@/lib/blogUtils";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";

interface PageParams {
  params: Promise<{ slug: string }>;
}

interface CalloutProps {
  type?: "info" | "warning" | "error" | "success";
  children: ReactNode;
}

interface CodeDemoProps {
  title?: string;
  children: ReactNode;
}

interface CodeProps extends ComponentPropsWithoutRef<"code"> {
  className?: string;
  children: ReactNode;
}

interface ImageProps extends ComponentPropsWithoutRef<"img"> {
  src?: string;
  alt?: string;
}

async function getBlogPost(slug: string) {
  try {
    const post = await db.query.posts.findFirst({
      where: (posts, { eq }) => eq(posts.slug, slug),
    });
    if (!post) return null;
    const readTime = Math.ceil(((post.content?.trim().split(" ").length || 0) / 230));
    return { ...post, readTime };
  } catch {
    return null;
  }
}

async function getRelatedPosts(currentSlug: string, category: string, limit = 3) {
  try {
    const posts = await db.query.posts.findMany({
      where: (posts, { eq, ne, and }) =>
        and(ne(posts.slug, currentSlug), eq(posts.category, category)),
      limit,
    });
    return posts.map((post) => ({
      ...post,
      readTime: `${Math.ceil(((post.content?.trim().split(" ").length || 0) / 230))} min read`,
      content: undefined,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };
  return generateBlogPostMetadata(post);
}

const mdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 mt-12 leading-tight" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4 mt-10 leading-tight" {...props} />
  ),
  h4: (props: ComponentPropsWithoutRef<"h4">) => (
    <h4 className="text-xl md:text-2xl font-semibold text-white mb-4 mt-8 leading-tight" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="text-gray-300 text-lg leading-relaxed mb-6" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      className="text-white hover:text-gray-200 underline underline-offset-4 decoration-2 decoration-gray-400 hover:decoration-white transition-colors duration-300"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="text-gray-300 text-lg leading-relaxed mb-6 space-y-2 pl-6 list-none" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="text-gray-300 text-lg leading-relaxed mb-6 space-y-2 pl-6 list-none" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="relative" {...props}>
      <span className="absolute -left-6 top-2 w-2 h-2 bg-gray-400 rounded-full" />
      {props.children}
    </li>
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-4 border-gray-400 pl-6 my-8 bg-gray-900/30 backdrop-blur-sm rounded-r-lg py-4" {...props}>
      <div className="text-gray-200 text-lg italic">{props.children}</div>
    </blockquote>
  ),
  code: ({ className, children, ...props }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match;

    if (isInline) {
      return (
        <code className="bg-gray-800/50 text-gray-200 px-2 py-1 rounded text-sm border border-gray-700/50" {...props}>
          {children}
        </code>
      );
    }

    const language = match[1] || "text";
    const codeString = String(children).replace(/\n$/, "");

    try {
      return (
        <div className="my-8 rounded-lg overflow-hidden border border-gray-800/50">
          <div className="bg-gray-800/50 px-4 py-2 text-sm text-gray-400 border-b border-gray-700/50">
            {language}
          </div>
          <SyntaxHighlighter
            // @ts-ignore
            style={oneDark}
            language={language}
            PreTag="div"
            className="!bg-gray-900/50 !m-0"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    } catch {
      return (
        <div className="my-8 rounded-lg overflow-hidden border border-gray-800/50">
          <div className="bg-gray-800/50 px-4 py-2 text-sm text-gray-400 border-b border-gray-700/50">
            {language}
          </div>
          <pre className="bg-gray-900/50 p-4 overflow-x-auto">
            <code className="text-gray-200 text-sm">{codeString}</code>
          </pre>
        </div>
      );
    }
  },
  pre: (props: ComponentPropsWithoutRef<"pre">) => <pre {...props} />,
  img: async ({ src, alt, ...props }: ImageProps) => {
    const imageExists = await checkImageExists(src || "");

    if (!imageExists) {
      return (
        <div className="my-8 rounded-lg overflow-hidden border border-gray-800/50">
          <div className="w-full h-48 bg-gray-900/50 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Image unavailable</p>
              {alt && <p className="text-xs text-gray-500 mt-1">{alt}</p>}
            </div>
          </div>
          {alt && (
            <div className="bg-gray-900/50 px-4 py-2 text-sm text-gray-400 border-t border-gray-800/50">{alt}</div>
          )}
        </div>
      );
    }

    return (
      <div className="my-8 rounded-lg overflow-hidden border border-gray-800/50">
        <img className="w-full h-auto" src={src} alt={alt} {...props} />
        {alt && (
          <div className="bg-gray-900/50 px-4 py-2 text-sm text-gray-400 border-t border-gray-800/50">{alt}</div>
        )}
      </div>
    );
  },
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" {...props} />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="my-8 overflow-x-auto rounded-lg border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
      <table className="min-w-full" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-gray-800/50" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-white border-b border-gray-700/50" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="px-4 py-3 text-gray-300 border-b border-gray-800/50" {...props} />
  ),
  Callout: ({ type = "info", children }: CalloutProps) => {
    const styles = {
      info: "border-blue-500/30 bg-blue-500/10 text-blue-200",
      warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
      error: "border-red-500/30 bg-red-500/10 text-red-200",
      success: "border-green-500/30 bg-green-500/10 text-green-200",
    };
    return (
      <div className={`border-l-4 pl-6 my-8 backdrop-blur-sm rounded-r-lg py-4 ${styles[type]}`}>
        {children}
      </div>
    );
  },
  CodeDemo: ({ title, children }: CodeDemoProps) => (
    <div className="my-8 border border-gray-800/50 rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-800/50 px-4 py-2 text-sm font-medium text-white border-b border-gray-700/50">
          {title}
        </div>
      )}
      <div className="p-4 bg-gray-900/30">{children}</div>
    </div>
  ),
};

const navItems = [{ href: "/blog", label: "← Back to Blog" }];

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const sanitizedContent = sanitizeMDXContent(post.content || "");
  const relatedPosts = await getRelatedPosts(slug, post.category || "");

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-gray-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Navbar items={navItems} />

      <article className="relative">
        <header className="relative container mx-auto pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-gray-300">{post.category}</span>
              <span>/</span>
              <span className="text-white truncate max-w-xs">{post.title}</span>
            </nav>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs px-3 py-1 bg-white/10 backdrop-blur-sm text-gray-200 rounded-full border border-white/20">
                {post.category}
              </span>
              {post.tags?.map((tag, i) => (
                <span key={i} className="text-xs px-3 py-1 bg-gray-400/10 backdrop-blur-sm text-gray-300 rounded-full border border-gray-400/20">
                  {tag}
                </span>
              ))}
            </div>

            <img
              src={post?.featuredImage || `https://placehold.co/1200x630?text=${encodeURIComponent(post.title || "Post")}`}
              alt={post.title || "Post"}
              className="w-full h-full object-cover rounded-xl mb-8"
            />

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">{post.title}</h1>

            {post.description && (
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-12 max-w-3xl">
                {post.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-t border-b border-gray-800/50">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                    {post.author?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="font-medium text-white">{post.author}</p>
                    <p className="text-sm text-gray-400">Author</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{post.readTime} min read</span>
                  </div>
                  <time dateTime={post.publishedAt || ""}>
                    {new Date(post.publishedAt || "").toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg prose-invert max-w-none">
              <MDXRemote source={sanitizedContent || ""} components={mdxComponents} />
            </div>

            <footer className="mt-16 pt-8 border-t border-gray-800/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-400">Tags:</span>
                {post.tags?.map((tag, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-gray-800/50 text-gray-300 rounded-full border border-gray-700/50">
                    #{tag}
                  </span>
                ))}
              </div>
            </footer>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="relative bg-gray-900/20 border-t border-gray-800/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Related Articles</h2>
                <p className="text-gray-400 text-lg">Continue exploring {post.category?.toLowerCase()} topics</p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((related, i) => (
                  <article key={related.id} className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-500 hover:scale-[1.02]">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={related?.featuredImage || `https://placehold.co/600x400?text=${encodeURIComponent(related.title || "Post")}`}
                        alt={related.title || "Post"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="text-xs px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full border border-white/20">
                          {related.category}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 p-6 space-y-4">
                      <h3 className="text-xl font-semibold text-white group-hover:text-gray-200 transition-colors duration-300 line-clamp-2">
                        <Link href={`/blog/${related.slug}`} className="hover:underline">{related.title}</Link>
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{related.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/50">
                        <span className="font-medium text-gray-300">{related.author}</span>
                        <span>{related.readTime}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link href="/blog" className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-medium hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  View All Articles
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="relative border-t border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "Auto Blog"} — powered by AI & Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
