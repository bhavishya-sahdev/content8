/** Validate the public webhook contract before passing values to the database. */
export function parseBlogPayload(input: unknown) {
  const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Expected data.meta and data.content in the request body.");
    }
    return value as Record<string, unknown>;
  };
  const data = object(object(input).data);
  const meta = object(data.meta);
  const required = (value: unknown, name: string, max: number) => {
    if (typeof value !== "string" || !value.trim() || value.length > max) {
      throw new Error(`${name} must be a non-empty string of at most ${max} characters.`);
    }
    return value.trim();
  };
  const list = (value: unknown, name: string): string[] => {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.length > 50 || value.some(
      (item) => typeof item !== "string" || !item.trim() || item.length > 100,
    )) throw new Error(`${name} must be an array of up to 50 non-empty strings (100 characters each).`);
    return [...new Set(value.map((item: string) => item.trim()))];
  };
  const slug = required(meta.slug, "slug", 200);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("slug must contain lowercase letters, numbers, and single hyphens between words.");
  }
  let featuredImage: string | null = null;
  if (meta.featuredImage !== undefined && meta.featuredImage !== null && meta.featuredImage !== "") {
    featuredImage = required(meta.featuredImage, "featuredImage", 2048);
    try {
      if (!["https:", "http:"].includes(new URL(featuredImage).protocol)) throw new Error();
    } catch { throw new Error("featuredImage must be an absolute HTTP or HTTPS URL."); }
  }
  return {
    title: required(meta.title, "title", 256),
    description: required(meta.description, "description", 2000),
    category: required(meta.category, "category", 100),
    slug,
    author: meta.author === undefined ? "Author" : required(meta.author, "author", 200),
    keywords: list(meta.keywords, "keywords"),
    tags: list(meta.tags, "tags"),
    featuredImage,
    content: required(data.content, "content", 500_000),
  };
}
