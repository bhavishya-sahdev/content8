import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBlogPayload } from "../src/lib/blogPayload";
import { siteOrigin } from "./onboarding";

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  if (!args.length || args.includes("--help")) {
    console.log("Usage: bun run publish -- <article.json> [--url http://localhost:3000]\nReads WEBHOOK_SECRET from your environment. The default target is localhost:3000.\nUse --url explicitly to publish to a deployed server with its matching secret.");
    return;
  }
  if (args.length !== 1 && !(args.length === 3 && args[1] === "--url")) throw new Error("Use publish <article.json> [--url <origin>].");
  loadEnvConfig(resolve(fileURLToPath(new URL("..", import.meta.url))), true);
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || secret === "your-secret-here") throw new Error("No publishing secret configured. Run bun run setup first.");
  const origin = siteOrigin(args[2] || "http://localhost:3000");
  let body: unknown;
  try { body = JSON.parse(readFileSync(resolve(args[0]), "utf8")); }
  catch { throw new Error("Could not read a JSON article file. Try examples/first-post.json."); }
  const post = parseBlogPayload(body);
  console.log(`Publishing ${post.slug} to ${origin}…`);
  let response: Response;
  try {
    response = await fetch(`${origin}/api/blog`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify(body),
    });
  } catch { throw new Error("Could not reach the publishing endpoint. Start bun run dev for localhost, or check --url. Use the final URL without redirects."); }
  if (!response.ok) {
    const hints: Record<number, string> = {
      400: "The server rejected the article. Check that client and server use the same payload format.",
      401: "The publishing secret does not match the server's WEBHOOK_SECRET.",
      503: "The server has no publishing secret configured.",
    };
    throw new Error(hints[response.status] || `Publishing failed (HTTP ${response.status}). Check the server logs.`);
  }
  const result = await response.json() as { status?: string };
  if (result.status !== "ok") throw new Error("The server did not confirm publication. Check its logs before retrying.");
  console.log(`Published: ${origin}/blog/${post.slug}`);
}

main().catch((error) => {
  console.error(`Publish stopped: ${error instanceof Error ? error.message : "Unexpected error"}`);
  process.exitCode = 1;
});
