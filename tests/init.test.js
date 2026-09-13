import { test, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

for (const layout of ["src", "root"]) {
  test(`installer handles ${layout} layout, existing utilities, and repeat runs`, () => {
    const cwd = mkdtempSync(join(tmpdir(), "content8-init-"));
    try {
      const base = layout === "src" ? join(cwd, "src") : cwd;
      mkdirSync(join(base, "app"), { recursive: true });
      mkdirSync(join(base, "lib"), { recursive: true });
      writeFileSync(join(base, "lib/utils.ts"), "export const existing = true;\n");
      writeFileSync(join(cwd, "package.json"), JSON.stringify({ dependencies: { next: "15.3.5" }, scripts: { dev: "next dev" } }));
      const run = () => spawnSync(process.execPath, [resolve("bin/init.mjs"), "init", "--yes", "--skip-install"], { cwd, encoding: "utf8" });
      const result = run();
      expect(result.status).toBe(0);
      expect(existsSync(join(base, "lib/blogImages.ts"))).toBe(true);
      expect(existsSync(join(base, "lib/blogPayload.ts"))).toBe(true);
      expect(readFileSync(join(base, "lib/utils.ts"), "utf8")).toBe("export const existing = true;\n");
      expect(readFileSync(join(cwd, "drizzle.config.ts"), "utf8")).toContain(layout === "src" ? "./src/db/schema" : "./db/schema");
      expect(JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")).scripts).toMatchObject({ dev: "next dev", "db:migrate": "drizzle-kit migrate" });
      writeFileSync(join(base, "components/BlogHeader.tsx"), "// custom header\n");
      expect(run().status).toBe(0);
      expect(readFileSync(join(base, "components/BlogHeader.tsx"), "utf8")).toBe("// custom header\n");
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });
}
