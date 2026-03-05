#!/usr/bin/env node
/**
 * auto-blog init
 * Copies blog routes, schema, and utilities into an existing Next.js project.
 *
 * Usage:
 *   npx auto-blog@latest init
 *   # or, inside the auto-blog repo:
 *   node bin/init.mjs
 */

import { createInterface } from "readline/promises";
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m",
  green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m",  cyan: "\x1b[36m",
  red: "\x1b[31m",   gray: "\x1b[90m",
  dim: "\x1b[2m",
};
const log = {
  info:    (m) => console.log(`  ${c.cyan}ℹ${c.reset}  ${m}`),
  ok:      (m) => console.log(`  ${c.green}✓${c.reset}  ${m}`),
  warn:    (m) => console.log(`  ${c.yellow}⚠${c.reset}  ${m}`),
  skip:    (m) => console.log(`  ${c.dim}–  ${m}${c.reset}`),
  section: (m) => console.log(`\n${c.bold}${m}${c.reset}`),
  code:    (m) => console.log(`     ${c.gray}${m}${c.reset}`),
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function detectPm(cwd) {
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun";
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

function readPkg(cwd) {
  const p = join(cwd, "package.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

function hasDep(pkg, name) {
  return !!(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function safeCopy(src, dest, label) {
  if (!existsSync(src)) { log.warn(`Source not found: ${src}`); return false; }
  if (existsSync(dest)) { log.skip(`${label} — already exists, skipping`); return false; }
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  log.ok(label);
  return true;
}

function run(cmd, cwd) {
  try {
    execSync(cmd, { stdio: "inherit", cwd });
    return true;
  } catch {
    return false;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q, def) =>
    rl.question(`  ${c.blue}?${c.reset}  ${q} ${c.dim}(${def})${c.reset} `);

  const cwd = process.cwd();
  // auto-blog's own src/ directory (works both locally and via npx)
  const pkgSrc = join(__dirname, "..", "src");

  console.log(`\n${c.bold}${c.cyan}  auto-blog init${c.reset}  ${c.dim}— adds a blog to your existing Next.js project${c.reset}\n`);

  // ── Preflight checks ──────────────────────────────────────────────────────
  const pkg = readPkg(cwd);
  if (!pkg) {
    log.warn("No package.json found. Run this from your project root.");
    rl.close(); process.exit(1);
  }

  const isNext = existsSync(join(cwd, "next.config.ts"))
    || existsSync(join(cwd, "next.config.js"))
    || existsSync(join(cwd, "next.config.mjs"));

  if (!isNext) {
    log.warn("No Next.js config detected.\n");
    console.log(`  auto-blog requires Next.js for the embedded integration.`);
    console.log(`  For other stacks, deploy auto-blog as a standalone service and`);
    console.log(`  proxy ${c.cyan}/blog${c.reset} using one of the configs in ${c.cyan}examples/${c.reset}:`);
    console.log(`  ${c.gray}https://github.com/bhavishyasahdev/auto-blog/tree/main/examples${c.reset}\n`);
    rl.close(); process.exit(0);
  }

  // Detect layout
  const hasSrc   = existsSync(join(cwd, "src", "app"));
  const appBase  = hasSrc ? join(cwd, "src", "app")        : join(cwd, "app");
  const libBase  = hasSrc ? join(cwd, "src", "lib")        : join(cwd, "lib");
  const compBase = hasSrc ? join(cwd, "src", "components") : join(cwd, "components");
  const dbBase   = hasSrc ? join(cwd, "src", "db")         : join(cwd, "db");

  const pm           = detectPm(cwd);
  const hasDrizzle   = hasDep(pkg, "drizzle-orm");
  const hasPg        = hasDep(pkg, "pg");
  const tailwindVer  = pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss || null;
  const isTailwindV3 = tailwindVer && tailwindVer.startsWith("^3");

  log.info(`Layout   : ${hasSrc ? "src/" : "no src/"}`);
  log.info(`Pkg mgr  : ${pm}`);
  log.info(`Drizzle  : ${hasDrizzle ? "yes" : "no"}`);
  log.info(`Tailwind : ${tailwindVer ?? "not found"}${isTailwindV3 ? c.yellow + "  ← auto-blog uses v4" + c.reset : ""}`);

  if (isTailwindV3) {
    log.warn("auto-blog uses Tailwind v4. Styles may not render correctly with v3.");
    log.warn("Consider upgrading: https://tailwindcss.com/docs/upgrade-guide");
  }

  // ── Questions ─────────────────────────────────────────────────────────────
  section("A few questions before we copy files:");

  // DB setup
  let dbMode = "full"; // "full" | "schema-only" | "skip"
  if (hasDrizzle && hasPg) {
    const ans = await ask(
      "You already have Drizzle + pg. Copy only the posts schema (skip db/index.ts)?",
      "Y/n"
    );
    dbMode = ans.toLowerCase() === "n" ? "full" : "schema-only";
  } else if (hasDrizzle) {
    log.warn("Drizzle detected but pg is not installed — auto-blog requires PostgreSQL.");
    const ans = await ask("Continue anyway?", "y/N");
    if (ans.toLowerCase() !== "y") { rl.close(); process.exit(0); }
    dbMode = "schema-only";
  }

  // Header
  const hasExistingHeader =
    existsSync(join(compBase, "Navbar.tsx"))  ||
    existsSync(join(compBase, "navbar.tsx"))  ||
    existsSync(join(compBase, "Header.tsx"))  ||
    existsSync(join(compBase, "header.tsx"));

  let headerMode = "blog-header"; // "blog-header" | "full-navbar"
  if (hasExistingHeader) {
    log.info("Header/Navbar already exists in your project.");
    log.info("We'll copy BlogHeader.tsx — a thin stub you can swap for your own.");
  } else {
    const ans = await ask(
      "Copy the full Navbar (Sheet, mobile menu, Radix UI) or a minimal header stub?",
      "minimal/full"
    );
    headerMode = ans.toLowerCase().startsWith("f") ? "full-navbar" : "blog-header";
  }

  rl.close();

  // ── Copy files ────────────────────────────────────────────────────────────
  section("Copying files...");

  // Blog pages
  safeCopy(join(pkgSrc, "app/blog/page.tsx"),            join(appBase, "blog/page.tsx"),                "app/blog/page.tsx");
  safeCopy(join(pkgSrc, "app/blog/[slug]/page.tsx"),     join(appBase, "blog/[slug]/page.tsx"),         "app/blog/[slug]/page.tsx");
  safeCopy(join(pkgSrc, "app/api/blog/route.ts"),        join(appBase, "api/blog/route.ts"),            "app/api/blog/route.ts");
  safeCopy(join(pkgSrc, "app/blog/rss.xml/route.ts"),    join(appBase, "blog/rss.xml/route.ts"),        "app/blog/rss.xml/route.ts");
  safeCopy(join(pkgSrc, "app/blog/sitemap.ts"),          join(appBase, "blog/sitemap.ts"),              "app/blog/sitemap.ts");

  // Lib
  safeCopy(join(pkgSrc, "lib/blogUtils.ts"),             join(libBase, "blogUtils.ts"),                 "lib/blogUtils.ts");
  if (!existsSync(join(libBase, "utils.ts"))) {
    safeCopy(join(pkgSrc, "lib/utils.ts"),               join(libBase, "utils.ts"),                     "lib/utils.ts");
  } else {
    log.skip("lib/utils.ts — already exists");
    log.info("Make sure it exports cn() and checkImageExists() — see lib/utils.ts in the auto-blog repo.");
  }

  // Header
  safeCopy(join(pkgSrc, "components/BlogHeader.tsx"),    join(compBase, "BlogHeader.tsx"),              "components/BlogHeader.tsx");
  if (headerMode === "full-navbar") {
    safeCopy(join(pkgSrc, "components/Navbar.tsx"),      join(compBase, "Navbar.tsx"),                  "components/Navbar.tsx");
    safeCopy(join(pkgSrc, "components/ui/button.tsx"),   join(compBase, "ui/button.tsx"),               "components/ui/button.tsx");
    safeCopy(join(pkgSrc, "components/ui/sheet.tsx"),    join(compBase, "ui/sheet.tsx"),                "components/ui/sheet.tsx");
    log.info("To use the full Navbar, update components/BlogHeader.tsx to import and re-export it.");
  }

  // DB
  if (dbMode === "full") {
    safeCopy(join(pkgSrc, "db/index.ts"),                join(dbBase, "index.ts"),                      "db/index.ts");
    safeCopy(join(pkgSrc, "db/schema/posts.ts"),         join(dbBase, "schema/posts.ts"),               "db/schema/posts.ts");
    safeCopy(join(pkgSrc, "db/schema/index.ts"),         join(dbBase, "schema/index.ts"),               "db/schema/index.ts");
  } else if (dbMode === "schema-only") {
    safeCopy(join(pkgSrc, "db/schema/posts.ts"),         join(dbBase, "schema/posts.ts"),               "db/schema/posts.ts");
    log.info("Add posts to your schema index:");
    log.code("import * as posts from './posts'");
    log.code("export default { ...yourExistingTables, ...posts }");
  }

  // ── Install missing deps ──────────────────────────────────────────────────
  section("Checking dependencies...");

  const deps = [
    "drizzle-orm", "pg", "next-mdx-remote",
    "react-syntax-highlighter", "rss",
    "@radix-ui/react-dialog", "@radix-ui/react-slot",
    "class-variance-authority", "clsx", "lucide-react", "tailwind-merge",
  ];
  const devDeps = [
    "drizzle-kit", "@types/pg", "@types/rss", "@types/react-syntax-highlighter",
  ];

  const missingDeps    = deps.filter((d)    => !hasDep(pkg, d));
  const missingDevDeps = devDeps.filter((d) => !hasDep(pkg, d));

  if (!missingDeps.length && !missingDevDeps.length) {
    log.ok("All dependencies already installed.");
  } else {
    const add  = pm === "npm" ? "install" : "add";
    const dev  = pm === "npm" ? "--save-dev" : pm === "yarn" ? "--dev" : "-D";

    if (missingDeps.length) {
      log.info(`Installing: ${missingDeps.join(" ")}`);
      const ok = run(`${pm} ${add} ${missingDeps.join(" ")}`, cwd);
      if (!ok) log.warn(`Auto-install failed. Run: ${pm} ${add} ${missingDeps.join(" ")}`);
      else log.ok("Dependencies installed.");
    }
    if (missingDevDeps.length) {
      log.info(`Installing dev: ${missingDevDeps.join(" ")}`);
      const ok = run(`${pm} ${add} ${dev} ${missingDevDeps.join(" ")}`, cwd);
      if (!ok) log.warn(`Auto-install failed. Run: ${pm} ${add} ${dev} ${missingDevDeps.join(" ")}`);
      else log.ok("Dev dependencies installed.");
    }
  }

  // ── next.config check ────────────────────────────────────────────────────
  section("Config check...");
  const nextCfgFile = ["next.config.ts","next.config.js","next.config.mjs"]
    .map((f) => join(cwd, f)).find(existsSync);
  const nextCfgContent = nextCfgFile ? readFileSync(nextCfgFile, "utf8") : "";
  if (!nextCfgContent.includes("next-mdx-remote")) {
    log.warn("Add transpilePackages to your next.config:");
    log.code("transpilePackages: ['next-mdx-remote'],");
  } else {
    log.ok("next.config already includes next-mdx-remote.");
  }

  // ── drizzle.config check ─────────────────────────────────────────────────
  if (!existsSync(join(cwd, "drizzle.config.ts")) && !existsSync(join(cwd, "drizzle.config.js"))) {
    log.warn("No drizzle.config found. Copy from auto-blog or create your own:");
    log.code("https://github.com/bhavishyasahdev/auto-blog/blob/main/drizzle.config.ts");
  }

  // ── Final instructions ────────────────────────────────────────────────────
  section("Done! Next steps:\n");

  console.log(`  ${c.bold}1. Add to your .env:${c.reset}`);
  log.code("DATABASE_URL=postgresql://...");
  log.code("DATABASE_SSL=false               # set to true for hosted DBs like Neon");
  log.code("NEXT_PUBLIC_SITE_URL=https://yourproject.com");
  log.code("NEXT_PUBLIC_SITE_NAME=Your Blog Name");
  log.code("WEBHOOK_SECRET=your-secret-here");

  console.log(`\n  ${c.bold}2. Run database migration:${c.reset}`);
  log.code(`${pm} run db:generate`);
  log.code(`${pm} run db:migrate`);
  log.code("(Add these scripts to package.json if not present)");

  if (hasExistingHeader || headerMode === "blog-header") {
    console.log(`\n  ${c.bold}3. Plug in your header:${c.reset}`);
    log.code("Edit components/BlogHeader.tsx to use your existing navbar.");
    log.code("It receives: { items: { href: string; label: string }[] }");
  }

  console.log(`\n  ${c.bold}4. Test the webhook:${c.reset}`);
  log.code("curl -X POST http://localhost:3000/api/blog \\");
  log.code('  -H "Content-Type: application/json" \\');
  log.code('  -H "x-webhook-secret: your-secret" \\');
  log.code("  -d '{\"data\":{\"meta\":{\"title\":\"Hello\",\"description\":\"Test\",\"category\":\"Test\",\"slug\":\"hello\",\"tags\":[],\"keywords\":[]},\"content\":\"# Hello\\n\\nThis works.\"}}'");

  console.log(`\n  ${c.bold}5. Visit /blog${c.reset}`);
  console.log(`\n  ${c.dim}Full docs: https://github.com/bhavishyasahdev/auto-blog${c.reset}\n`);
}

function section(msg) {
  console.log(`\n${c.bold}${msg}${c.reset}`);
}

main().catch((e) => {
  console.error(`\n${c.red}Error:${c.reset}`, e.message);
  process.exit(1);
});
