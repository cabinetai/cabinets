#!/usr/bin/env node
/**
 * sync-shared.mjs [--check]
 *
 * Code that more than one template uses lives once, in shared/ at the root of
 * this repo. A template installs from its own folder alone, and a sealed app
 * frame cannot load a file next to its page, so the code is pasted into each
 * page that marks a place for it:
 *
 *   <script data-shared="basemap.js">
 *   ...the whole of shared/basemap.js...
 *   </script>
 *
 *   node .github/scripts/sync-shared.mjs          pastes every copy
 *   node .github/scripts/sync-shared.mjs --check  lists the pages with an older copy, exits 1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKIP = new Set(["node_modules", "shared", "details", "public"]);
const BLOCK = /(<script data-shared="([^"]+)">)[\s\S]*?(<\/script>)/g;

/** Every template page that marks a place for a shared file. */
export function sharedPages(root = ROOT) {
  const pages = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html") && fs.readFileSync(full, "utf8").includes("<script data-shared=")) {
        pages.push(full);
      }
    }
  };
  walk(root);
  return pages;
}

/** The page with every marked place holding the current shared file. */
export function pasted(html, root = ROOT) {
  return html.replace(BLOCK, (_, open, name, close) => {
    const source = fs.readFileSync(path.join(root, "shared", path.basename(name)), "utf8");
    return `${open}\n${source}${close}`;
  });
}

/** The pages whose copy differs from shared/, as repo-relative paths. */
export function stalePages(root = ROOT) {
  return sharedPages(root)
    .filter((page) => {
      const html = fs.readFileSync(page, "utf8");
      return pasted(html, root) !== html;
    })
    .map((page) => path.relative(root, page));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const stale = stalePages();
    if (stale.length) {
      console.error(`These pages hold an older copy of shared/. Run node .github/scripts/sync-shared.mjs:\n  ${stale.join("\n  ")}`);
      process.exit(1);
    }
    console.log("Every shared copy matches.");
  } else {
    for (const page of sharedPages()) {
      fs.writeFileSync(page, pasted(fs.readFileSync(page, "utf8")));
      console.log(path.relative(ROOT, page));
    }
  }
}
