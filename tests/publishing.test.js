import { afterAll, beforeAll, beforeEach, expect, mock, test } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import schema from "../src/db/schema";

const client = new PGlite();
const db = drizzle(client, { schema, casing: "snake_case" });
const invalidated = [];
mock.module("@/db", () => ({ db }));
mock.module("next/cache", () => ({ revalidatePath: (path) => invalidated.push(path) }));
const { POST } = await import("../src/app/api/blog/route");
const oldSecret = process.env.WEBHOOK_SECRET;
const body = (content = "## Original article") => ({ data: {
  meta: { title: "A tutorial", slug: "a-tutorial", description: "A useful guide", category: "Tutorials" }, content,
} });
const request = (payload, secret = "test-secret") => new Request("http://localhost/api/blog", {
  method: "POST", headers: { "Content-Type": "application/json", "x-webhook-secret": secret }, body: JSON.stringify(payload),
});

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  await migrate(db, { migrationsFolder: "drizzle" });
});
beforeEach(async () => {
  process.env.WEBHOOK_SECRET = "test-secret";
  invalidated.length = 0;
  await client.exec("TRUNCATE TABLE posts RESTART IDENTITY");
});
afterAll(async () => {
  if (oldSecret === undefined) delete process.env.WEBHOOK_SECRET;
  else process.env.WEBHOOK_SECRET = oldSecret;
  await client.close();
});

test("publishes and corrects an article at the same URL without duplicating or redating it", async () => {
  const first = await POST(request(body()));
  expect(first.status).toBe(200);
  expect(await first.json()).toMatchObject({ status: "ok", data: { slug: "a-tutorial", path: "/blog/a-tutorial" } });
  const original = await db.query.posts.findFirst();
  const correction = await POST(request(body("## Corrected article")));
  expect(correction.status).toBe(200);
  const rows = await db.query.posts.findMany();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ id: original.id, publishedAt: original.publishedAt, content: "## Corrected article" });
  expect(invalidated).toContain("/blog/a-tutorial");
  expect(invalidated).toContain("/blog/sitemap.xml");
  expect(invalidated).toContain("/blog/rss.xml");
});

test("fails closed without a configured secret and rejects incorrect credentials", async () => {
  delete process.env.WEBHOOK_SECRET;
  expect((await POST(request(body()))).status).toBe(503);
  process.env.WEBHOOK_SECRET = "test-secret";
  expect((await POST(request(body(), "wrong"))).status).toBe(401);
  expect(await db.query.posts.findMany()).toHaveLength(0);
});

test("rejects malformed JSON and malformed payloads without touching the database", async () => {
  const malformed = new Request("http://localhost/api/blog", { method: "POST", headers: { "x-webhook-secret": "test-secret" }, body: "{" });
  expect((await POST(malformed)).status).toBe(400);
  expect((await POST(request({}))).status).toBe(400);
  expect(await db.query.posts.findMany()).toHaveLength(0);
});
