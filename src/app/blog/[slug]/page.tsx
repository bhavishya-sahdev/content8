import { db } from "@/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ComponentPropsWithoutRef, ReactNode } from "react";
import { checkImageExists } from "@/lib/blogImages";
import { generateBlogPostMetadata, generateBlogPostJsonLd, sanitizeMDXContent } from "@/lib/blogUtils";
import { Metadata } from "next";
import BlogHeader from "@/components/BlogHeader";

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
    const readTime = Math.ceil((post.content?.trim().split(" ").length || 0) / 230);
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
      readTime: `${Math.ceil((post.content?.trim().split(" ").length || 0) / 230)} min read`,
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
    <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-6 mt-8 leading-tight" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-4 mt-10 leading-tight" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-xl md:text-2xl font-semibold text-zinc-100 mb-3 mt-8 leading-tight" {...props} />
  ),
  h4: (props: ComponentPropsWithoutRef<"h4">) => (
    <h4 className="text-lg font-semibold text-zinc-100 mb-3 mt-6 leading-tight" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="text-zinc-300 text-base leading-relaxed mb-5" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      className="text-zinc-100 underline underline-offset-2 decoration-zinc-600 hover:decoration-zinc-300 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="text-zinc-300 text-base leading-relaxed mb-5 pl-5 list-disc space-y-1.5" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="text-zinc-300 text-base leading-relaxed mb-5 pl-5 list-decimal space-y-1.5" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-4 border-zinc-700 pl-5 my-6 py-1" {...props}>
      <div className="text-zinc-400 italic">{props.children}</div>
    </blockquote>
  ),
  code: ({ className, children, ...props }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match;

    if (isInline) {
      return (
        <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-[0.875em] font-mono" {...props}>
          {children}
        </code>
      );
    }

    const language = match[1] || "text";
    const codeString = String(children).replace(/\n$/, "");

    try {
      return (
        <div className="my-6 rounded-lg overflow-hidden border border-zinc-700">
          <div className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700 font-mono">
            {language}
          </div>
          <SyntaxHighlighter
            // @ts-ignore
            style={oneLight}
            language={language}
            PreTag="div"
            className="!m-0 !text-sm"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    } catch {
      return (
        <div className="my-6 rounded-lg overflow-hidden border border-zinc-700">
          <div className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700 font-mono">
            {language}
          </div>
          <pre className="bg-zinc-900 p-4 overflow-x-auto">
            <code className="text-zinc-200 text-sm font-mono">{codeString}</code>
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
        <div className="my-6 rounded-lg overflow-hidden border border-zinc-700">
          <div className="w-full h-40 bg-zinc-800 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <svg className="w-8 h-8 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs">Image unavailable</p>
              {alt && <p className="text-xs text-zinc-500 mt-0.5">{alt}</p>}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="my-6 rounded-lg overflow-hidden border border-zinc-700">
        <img className="w-full h-auto" src={src} alt={alt} {...props} />
        {alt && (
          <div className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 border-t border-zinc-700">{alt}</div>
        )}
      </div>
    );
  },
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-10 border-zinc-800" {...props} />
  ),
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-zinc-700">
      <table className="min-w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-zinc-800" {...props} />
  ),
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide border-b border-zinc-700" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="px-4 py-3 text-zinc-300 border-b border-zinc-800" {...props} />
  ),
  Callout: ({ type = "info", children }: CalloutProps) => {
    const styles = {
      info: "border-blue-500/50 bg-blue-500/10 text-blue-300",
      warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
      error: "border-red-500/50 bg-red-500/10 text-red-300",
      success: "border-green-500/50 bg-green-500/10 text-green-300",
    };
    return (
      <div className={`border-l-4 pl-5 my-6 py-3 rounded-r-lg ${styles[type]}`}>
        {children}
      </div>
    );
  },
  CodeDemo: ({ title, children }: CodeDemoProps) => (
    <div className="my-6 border border-zinc-700 rounded-lg overflow-hidden">
      {title && (
        <div className="bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 border-b border-zinc-700">
          {title}
        </div>
      )}
      <div className="p-4 bg-zinc-900">{children}</div>
    </div>
  ),
};

const navItems = [{ href: "/blog", label: "← Blog" }];

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const sanitizedContent = sanitizeMDXContent(post.content || "");
  const relatedPosts = await getRelatedPosts(slug, post.category || "");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <BlogHeader items={navItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBlogPostJsonLd(post)).replace(/</g, "\\u003c"),
        }}
      />

      <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/blog" className="hover:text-zinc-300 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">{post.category}</span>
        </nav>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs font-medium px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded-full">
            {post.category}
          </span>
          {post.tags?.map((tag, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-zinc-800/60 text-zinc-500 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Description */}
        {post.description && (
          <p className="text-lg text-zinc-400 leading-relaxed mb-6">
            {post.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 pb-8 border-b border-zinc-800 mb-8">
          <span className="font-medium text-zinc-400">{post.author}</span>
          <span>·</span>
          <time dateTime={post.publishedAt || ""}>
            {new Date(post.publishedAt || "").toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readTime} min read</span>
        </div>

        {/* Featured image */}
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title || "Post"}
            className="w-full h-auto rounded-lg mb-10 border border-zinc-800"
          />
        )}

        {/* Content */}
        <div className="max-w-none">
          <MDXRemote source={sanitizedContent || ""} components={mdxComponents} />
        </div>

        {/* Post footer tags */}
        {post.tags && post.tags.length > 0 && (
          <footer className="mt-12 pt-8 border-t border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-zinc-500">Tags:</span>
              {post.tags.map((tag, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-zinc-800 bg-zinc-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
            <h2 className="text-xl font-semibold text-zinc-100 mb-8">
              More in {post.category}
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <article key={related.id} className="group border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                  <h3 className="text-base font-semibold text-zinc-100 mb-2 line-clamp-2">
                    <Link href={`/blog/${related.slug}`} className="group-hover:text-zinc-300 transition-colors">
                      {related.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{related.description}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <span>{related.author}</span>
                    <span>·</span>
                    <span>{related.readTime}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                ← All articles
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "Content8"}
          </p>
        </div>
      </footer>
    </div>
  );
}
