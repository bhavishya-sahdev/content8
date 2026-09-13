import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { posts } from "../src/db/schema/posts";
import { parseBlogPayload } from "../src/lib/blogPayload";
import { databaseSettings, publishingSecret, saveSettings, siteOrigin } from "./onboarding";

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  if (args.includes("--help")) {
    console.log("Usage: bun run setup [--yes]\nConfigures .env, checks PostgreSQL, applies migrations, and adds a sample to an empty blog.\n--yes uses existing environment values and defaults; DATABASE_URL is required.");
    return;
  }
  if (args.some((arg) => arg !== "--yes")) throw new Error("Unknown option. Use bun run setup --help.");
  const cwd = resolve(fileURLToPath(new URL("..", import.meta.url)));
  loadEnvConfig(cwd, true);
  const automatic = args.includes("--yes") || !process.stdin.isTTY;
  const rl = automatic ? null : createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label: string, fallback = "") => automatic ? fallback : (await rl!.question(`${label}${fallback ? ` [${fallback}]` : ""}: `)).trim() || fallback;

  console.log("\ncontent8 setup\nUse a new PostgreSQL database. Your connection URL and secret stay in .env.\n");
  let settings: Record<string, string>;
  try {
    let connection = process.env.DATABASE_URL || "";
    if (connection.includes("user:password@host")) connection = "";
    if (!connection) {
      if (automatic) throw new Error("DATABASE_URL is missing. Run bun run setup in an interactive terminal to enter your PostgreSQL URL, or set DATABASE_URL first.");
      connection = await ask("PostgreSQL connection URL (from your provider or local database)");
    } else console.log("Using the configured database connection.");
    const database = databaseSettings(connection, process.env.DATABASE_SSL);
    settings = {
      ...database,
      NEXT_PUBLIC_SITE_NAME: await ask("Blog name", process.env.NEXT_PUBLIC_SITE_NAME || "Content8"),
      NEXT_PUBLIC_SITE_URL: siteOrigin(await ask("Public site origin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")),
      WEBHOOK_SECRET: publishingSecret(process.env.WEBHOOK_SECRET),
    };
  } finally { rl?.close(); }

  // Persist configuration before connecting so a transient failure is easy to retry.
  saveSettings(cwd, settings);
  console.log("Saved .env. Publishing secret configured.");
  const pool = new pg.Pool({
    connectionString: settings.DATABASE_URL,
    ssl: settings.DATABASE_SSL === "true",
    connectionTimeoutMillis: 10_000,
    statement_timeout: 30_000,
    max: 1,
  });
  let stage = "connect";
  try {
    console.log("Checking PostgreSQL…");
    const { rows } = await pool.query("SELECT to_regclass('public.posts') AS posts, to_regclass('drizzle.__drizzle_migrations') AS migrations");
    if (rows[0].posts && !rows[0].migrations) {
      throw new Error("UNTRACKED_SCHEMA");
    }
    stage = "migrate";
    const db = drizzle(pool, { casing: "snake_case" });
    await migrate(db, { migrationsFolder: resolve(cwd, "drizzle") });
    console.log("Database ready.");
    stage = "sample";
    const existing = await db.select({ id: posts.id }).from(posts).limit(1);
    let path = "/blog";
    if (!existing.length) {
      const sample = parseBlogPayload(JSON.parse(readFileSync(resolve(cwd, "examples/first-post.json"), "utf8")));
      await db.insert(posts).values(sample).onConflictDoNothing();
      path += `/${sample.slug}`;
      console.log("Added your first sample article.");
    } else console.log("Existing articles found; sample skipped.");
    console.log(`\nReady. Run:\n  bun run dev\n\nThen open http://localhost:3000${path}\n\nTo publish another article while the server is running:\n  bun run publish -- examples/first-post.json\n`);
  } catch (error) {
    if (error instanceof Error && error.message === "UNTRACKED_SCHEMA") {
      throw new Error("This database already has a posts table without a migration history. Use an empty database for standalone setup, or use the embedded integration for an existing schema.");
    }
    const actions = {
      connect: "Could not connect to PostgreSQL. Check DATABASE_URL and DATABASE_SSL in .env and that your database is reachable.",
      migrate: "Could not apply migrations. Check database permissions and migration history.",
      sample: "Database setup finished, but the sample could not be created. Check table permissions.",
    };
    throw new Error(`${actions[stage as keyof typeof actions]} Your configuration is saved; rerun bun run setup to retry.`);
  } finally { await pool.end(); }
}

main().catch((error) => {
  console.error(`\nSetup stopped: ${error instanceof Error ? error.message : "Unexpected error"}`);
  process.exitCode = 1;
});
