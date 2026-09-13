import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function databaseSettings(value: string, ssl?: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Enter a valid PostgreSQL connection URL."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
    throw new Error("Use a PostgreSQL URL with a host and database name.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  return { DATABASE_URL: value, DATABASE_SSL: ssl === "true" || ssl === "false" ? ssl : local ? "false" : "true" };
}

export function siteOrigin(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Use a site URL such as http://localhost:3000 or https://blog.example.com."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("The site URL must be an HTTP(S) origin without a path, query, or credentials.");
  }
  if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Use HTTPS when publishing outside localhost to protect your webhook secret.");
  }
  return url.origin;
}

export function publishingSecret(existing?: string) {
  return existing && existing !== "your-secret-here" ? existing : randomBytes(32).toString("hex");
}

/** Update only onboarding keys; retain other settings and comments. */
export function saveSettings(cwd: string, values: Record<string, string>) {
  const path = join(cwd, ".env");
  let text = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${JSON.stringify(value).replace(/\$/g, "\\$")}`;
    const pattern = new RegExp(`^(?:export\\s+)?${key}\\s*=.*$`, "gm");
    text = pattern.test(text) ? text.replace(pattern, () => line) : text + (text && !text.endsWith("\n") ? "\n" : "") + line + "\n";
  }
  writeFileSync(path, text, { mode: 0o600 });
  const ignorePath = join(cwd, ".gitignore");
  const ignores = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
  if (!ignores.split(/\r?\n/).includes(".env")) {
    appendFileSync(ignorePath, `${ignores && !ignores.endsWith("\n") ? "\n" : ""}.env\n`);
  }
}
