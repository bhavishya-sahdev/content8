import { describe, expect, test } from "bun:test";
import { parseBlogPayload } from "../src/lib/blogPayload";
import { generateBlogPostMetadata, generateBlogPostJsonLd } from "../src/lib/blogUtils";

const payload = () => ({ data: { meta: {
  title: "Hello", description: "A guide", slug: "hello-world", category: "Tutorials",
}, content: "## Hello\n\nA useful article." } });

describe("webhook payload", () => {
  test("accepts the minimum documented payload and normalizes optional fields", () => {
    expect(parseBlogPayload(payload())).toMatchObject({ tags: [], keywords: [], featuredImage: null, author: "Author", slug: "hello-world" });
  });
  test.each([null, [], {}, { data: {} }, { data: { meta: null } }].map((body) => [body]))("rejects malformed bodies: %j", (body) => {
    expect(() => parseBlogPayload(body)).toThrow();
  });
  test.each(["../admin", "UPPERCASE", "hello/world", "hello?x=1", "hello--world", ""])('rejects invalid slug "%s"', (slug) => {
    const body = payload(); body.data.meta.slug = slug;
    expect(() => parseBlogPayload(body)).toThrow();
  });
  test("rejects invalid arrays, oversized titles, and unsafe image schemes", () => {
    for (const patch of [{ tags: "tag" }, { tags: [null] }, { title: "a".repeat(257) }, { featuredImage: "javascript:alert(1)" }]) {
      const body = payload(); Object.assign(body.data.meta, patch);
      expect(() => parseBlogPayload(body)).toThrow();
    }
  });
  test("preserves article markup and deduplicates tags", () => {
    const body = payload(); body.data.meta.tags = [" nextjs ", "nextjs"];
    expect(parseBlogPayload(body)).toMatchObject({ content: body.data.content, tags: ["nextjs"] });
  });
});

describe("SEO output", () => {
  test("provides canonical URLs without pointing to a nonexistent fallback image", () => {
    const post = { ...parseBlogPayload(payload()), publishedAt: "2026-09-13", readTime: 1 };
    expect(generateBlogPostMetadata(post).alternates.canonical).toEndWith("/blog/hello-world");
    expect(generateBlogPostMetadata(post).openGraph.images).toBeUndefined();
    expect(generateBlogPostJsonLd(post)["@type"]).toBe("BlogPosting");
    expect(generateBlogPostJsonLd(post).image).toBeUndefined();
  });
});
