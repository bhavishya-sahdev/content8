import { Metadata } from "next";

interface BlogPostMetaProps {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  author: string;
  readTime: number;
  featuredImage?: string | null;
  content?: string;
}

export function generateBlogPostMetadata({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  tags,
  author,
  readTime,
  featuredImage,
  content,
}: BlogPostMetaProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${baseUrl}/blog/${slug}`;
  const imageUrl = featuredImage || `${baseUrl}/og-default.jpg`;

  const metaDescription =
    description ||
    (content
      ? content.replace(/<[^>]*>/g, "").slice(0, 160) + "..."
      : "A technical blog post.");

  return {
    title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || "Auto Blog"}`,
    description: metaDescription,
    keywords: [...tags, "blog", "technical", "programming"],
    authors: [{ name: author }],
    openGraph: {
      title,
      description: metaDescription,
      url: postUrl,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Auto Blog",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      type: "article",
      publishedTime: publishedAt,
      modifiedTime: updatedAt || publishedAt,
      authors: [author],
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "article:author": author,
      "article:published_time": publishedAt,
      "article:modified_time": updatedAt || publishedAt,
      "article:tag": tags.join(", "),
      "twitter:label1": "Reading time",
      "twitter:data1": `${readTime} min read`,
      "twitter:label2": "Tags",
      "twitter:data2": tags.slice(0, 3).join(", "),
    },
  };
}

export function generateBlogPostJsonLd({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  tags,
  author,
  featuredImage,
  content,
}: BlogPostMetaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: featuredImage || `${baseUrl}/og-default.jpg`,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      "@type": "Person",
      name: author,
      url: baseUrl,
    },
    publisher: {
      "@type": "Person",
      name: author,
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${slug}`,
    },
    keywords: tags.join(", "),
    wordCount: content ? content.split(" ").length : undefined,
    timeRequired: `PT${Math.ceil((content?.split(" ").length || 0) / 200)}M`,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "Blog",
      "@id": `${baseUrl}/blog`,
      name: process.env.NEXT_PUBLIC_SITE_NAME || "Auto Blog",
    },
  };
}

export function sanitizeMDXContent(content: string): string {
  if (!content) return "";

  return (
    content
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")

      .replace(
        /\|([^|]+(?:\|[^|]+)*)\|\|(-+(?:\|-+)*)\|\|([^|]+(?:\|[^|]+)*)\|/g,
        (match, headers, separators, values) => {
          const headerCells = headers
            .split("|")
            .map((h: string) => h.trim())
            .filter((h: string) => h.length > 0);
          const valueCells = values
            .split("|")
            .map((v: string) => v.trim())
            .filter((v: string) => v.length > 0);
          const sepCells = headerCells.map(() => "---");
          const headerRow = `| ${headerCells.join(" | ")} |`;
          const separatorRow = `| ${sepCells.join(" | ")} |`;
          const valueRow = `| ${valueCells.join(" | ")} |`;
          return `\n${headerRow}\n${separatorRow}\n${valueRow}\n`;
        }
      )

      .replace(
        /\|([^|]+)\|\|(-+)\|\|([^|]+)\|/g,
        (match, header, separator, value) => {
          return `\n| ${header.trim()} |\n|---|\n| ${value.trim()} |\n`;
        }
      )

      .replace(
        /\|([^|]+)\|(-{3,})\|\|([^|]+)\|/g,
        (match, header, separator, value) => {
          return `\n| ${header.trim()} |\n|---|\n| ${value.trim()} |\n`;
        }
      )

      .replace(
        /\|([^|]+)\|(-{3,})\|([^|]+)\|(?!\|)/g,
        (match, header, separator, value) => {
          return `\n| ${header.trim()} |\n|---|\n| ${value.trim()} |\n`;
        }
      )

      .replace(
        /(\|[^|]+(?:\|[^|]+)*\|\|[^|]+(?:\|[^|]+)*\|\|[^|]+(?:\|[^|]+)*\|(?:\|\|[^|]+(?:\|[^|]+)*\|)*)/g,
        (match) => {
          const sections = match.split("||");
          if (sections.length < 3) return match;
          const headers = sections[0]
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((h) => h.trim())
            .filter((h) => h.length > 0);
          const separators = sections[1]
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          const isSeparatorRow = separators.every((s) => /^-+$/.test(s));
          if (!isSeparatorRow) return match;
          let result = `\n| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n`;
          for (let i = 2; i < sections.length; i++) {
            const rowData = sections[i]
              .replace(/^\||\|$/g, "")
              .split("|")
              .map((d) => d.trim())
              .filter((d) => d.length > 0);
            if (rowData.length > 0) {
              result += `| ${rowData.join(" | ")} |\n`;
            }
          }
          return result;
        }
      )

      .replace(/\|([^|]+)\|/g, (match, content, offset, string) => {
        const beforeMatch = string.substring(0, offset);
        const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
        const inlineCodeCount = (beforeMatch.match(/`/g) || []).length;
        if (codeBlockCount % 2 === 1 || inlineCodeCount % 2 === 1) return match;
        const lineStart = string.lastIndexOf("\n", offset) + 1;
        const lineEnd = string.indexOf("\n", offset);
        const currentLine = string.substring(lineStart, lineEnd === -1 ? string.length : lineEnd);
        if (currentLine.trim().startsWith("|") && currentLine.trim().endsWith("|")) return match;
        if (content.includes("-") && content.match(/^-+$/)) return `|${content}|`;
        return match;
      })

      .replace(/\{([^}]*)\}/g, (match, inner, offset, string) => {
        const beforeMatch = string.substring(0, offset);
        const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
        const inlineCodeCount = (beforeMatch.match(/`/g) || []).length;
        if (codeBlockCount % 2 === 1 || inlineCodeCount % 2 === 1) return match;
        if (
          inner.includes("=") || inner.includes(":") || inner.includes('"') ||
          inner.includes("'") || inner.includes("=>") || inner.includes("()") ||
          inner.includes("[]") || inner.includes("?") || inner.includes("&&") ||
          inner.includes("||") || inner.includes("return") || inner.includes("useState") ||
          inner.includes("useEffect") || inner.includes("map") || inner.includes("filter") ||
          inner.includes("item.") || inner.includes("props.") || inner.includes("state.") ||
          /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(inner.trim())
        ) {
          return match;
        }
        return `\\{${inner}\\}`;
      })

      .replace(/<(?![a-zA-Z/])/g, (match, offset, string) => {
        const beforeMatch = string.substring(0, offset);
        const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
        const inlineCodeCount = (beforeMatch.match(/`/g) || []).length;
        if (codeBlockCount % 2 === 1 || inlineCodeCount % 2 === 1) return match;
        return "\\<";
      })
      .replace(/(?<![a-zA-Z/])>/g, (match, offset, string) => {
        const beforeMatch = string.substring(0, offset);
        const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
        const inlineCodeCount = (beforeMatch.match(/`/g) || []).length;
        if (codeBlockCount % 2 === 1 || inlineCodeCount % 2 === 1) return match;
        return "\\>";
      })

      .replace(/\u2018/g, "'")
      .replace(/\u2019/g, "'")
      .replace(/\u201C/g, '"')
      .replace(/\u201D/g, '"')
      .replace(/\u2013/g, "-")
      .replace(/\u2014/g, "--")

      // @ts-ignore
      .replace(/\{([^}]*)\n([^}]*)\}/gs, (match, p1, p2, offset, string) => {
        const beforeMatch = string.substring(0, offset);
        const codeBlockCount = (beforeMatch.match(/```/g) || []).length;
        if (codeBlockCount % 2 === 1) return match;
        const inner = p1 + "\n" + p2;
        if (!inner.includes("return") && !inner.includes("=>") &&
            !inner.includes("useState") && !inner.includes("useEffect")) {
          return match.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
        }
        return match;
      })
  );
}
