import { sql } from "drizzle-orm";
import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const posts = table(
  "posts",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    description: t.varchar().notNull(),
    slug: t.varchar().notNull(),
    title: t.varchar({ length: 256 }).notNull(),
    author: t.varchar().default("Author").notNull(),
    keywords: t
      .varchar()
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    category: t.varchar().notNull(),
    tags: t
      .varchar()
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    content: t.text().notNull(),
    featuredImage: t.varchar("featured_image"),
    publishedAt: t
      .timestamp("published_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    t.uniqueIndex("slug_idx").on(table.slug),
    t.index("title_idx").on(table.title),
  ]
);
