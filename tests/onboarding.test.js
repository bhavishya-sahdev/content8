import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { databaseSettings, publishingSecret, saveSettings, siteOrigin } from "../scripts/onboarding";

const run = (script, args, env = {}) => new Promise((resolveResult, reject) => {
  const child = spawn(process.execPath, [resolve(script), ...args], {
    env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (data) => { output += data; });
  child.stderr.on("data", (data) => { output += data; });
  child.on("error", reject);
  child.on("close", (code) => resolveResult({ code, output }));
});

test("setup validates database URLs and chooses TLS defaults", () => {
  expect(databaseSettings("postgresql://user:pass@localhost/content8").DATABASE_SSL).toBe("false");
  expect(databaseSettings("postgresql://user:pass@db.example.com/content8").DATABASE_SSL).toBe("true");
  expect(databaseSettings("postgresql://user:pass@db.example.com/content8", "false").DATABASE_SSL).toBe("false");
  expect(() => databaseSettings("https://example.com/db")).toThrow();
});

test("setup generates secrets once and preserves unrelated config on repeated runs", () => {
  const cwd = mkdtempSync(join(tmpdir(), "content8-settings-"));
  try {
    writeFileSync(join(cwd, ".env"), '# keep this comment\nOTHER_SETTING="unchanged"\nWEBHOOK_SECRET=your-secret-here\n');
    const secret = publishingSecret("your-secret-here");
    expect(secret).toHaveLength(64);
    expect(publishingSecret(secret)).toBe(secret);
    saveSettings(cwd, { WEBHOOK_SECRET: secret, DATABASE_URL: "postgresql://u:p$word@localhost/blog" });
    saveSettings(cwd, { WEBHOOK_SECRET: secret });
    const result = readFileSync(join(cwd, ".env"), "utf8");
    expect(result).toContain('# keep this comment\nOTHER_SETTING="unchanged"');
    expect(result.match(/^WEBHOOK_SECRET=/gm)).toHaveLength(1);
    expect(result).toContain("p\\$word");
    expect(readFileSync(join(cwd, ".gitignore"), "utf8")).toBe(".env\n");
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("publishing rejects insecure remote targets and URLs with credentials or paths", () => {
  expect(siteOrigin("http://localhost:3000/")).toBe("http://localhost:3000");
  expect(siteOrigin("https://blog.example.com")).toBe("https://blog.example.com");
  for (const value of ["http://example.com", "https://u:p@example.com", "https://example.com/blog", "https://example.com?x=1"]) {
    expect(() => siteOrigin(value)).toThrow();
  }
});

test("setup gives actionable errors without echoing database credentials", async () => {
  const result = await run("scripts/setup.ts", ["--yes"], { DATABASE_URL: "https://private-password@example.com/db" });
  expect(result.code).toBe(1);
  expect(result.output).toContain("PostgreSQL URL");
  expect(result.output).not.toContain("private-password");
});

test("publish sends the article and secret, reports its URL, and explains authentication failures", async () => {
  const requests = [];
  let status = 200;
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (data) => { body += data; });
    req.on("end", () => {
      requests.push({ path: req.url, secret: req.headers["x-webhook-secret"], body: JSON.parse(body) });
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: status === 200 ? "ok" : "unauthorized" }));
    });
  });
  await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const args = ["examples/first-post.json", "--url", origin];
    const result = await run("scripts/publish.ts", args, { WEBHOOK_SECRET: "private-test-secret" });
    expect(result.code).toBe(0);
    expect(result.output).toContain(`${origin}/blog/hello-content8`);
    expect(result.output).not.toContain("private-test-secret");
    expect(requests[0]).toMatchObject({ path: "/api/blog", secret: "private-test-secret", body: { data: { meta: { slug: "hello-content8" } } } });
    status = 401;
    const rejected = await run("scripts/publish.ts", args, { WEBHOOK_SECRET: "wrong" });
    expect(rejected.code).toBe(1);
    expect(rejected.output).toContain("does not match");
  } finally { await new Promise((done) => server.close(done)); }
});
