// A shared file (shared/*.js) is pasted into every page that marks a place for
// it. These tests keep each copy equal to the one source, so a fix lands in
// every template.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { pasted, sharedPages, stalePages } from "../sync-shared.mjs";

test("every page's copy of a shared file matches its source", () => {
  assert.deepEqual(stalePages(), [], "Run node .github/scripts/sync-shared.mjs");
});

test("a page that marks a place is found, filled, and reported when its copy is old", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "shared-"));
  fs.mkdirSync(path.join(root, "shared"));
  fs.writeFileSync(path.join(root, "shared", "basemap.js"), "one();\n");
  const page = path.join(root, "a-template", "map", "index.html");
  fs.mkdirSync(path.dirname(page), { recursive: true });
  fs.writeFileSync(page, '<p>x</p><script data-shared="basemap.js"></script><script>own();</script>');
  fs.mkdirSync(path.join(root, "other"));
  fs.writeFileSync(path.join(root, "other", "index.html"), "<p>no map</p>");

  assert.deepEqual(sharedPages(root), [page]);
  assert.deepEqual(stalePages(root), [path.join("a-template", "map", "index.html")]);

  const filled = pasted(fs.readFileSync(page, "utf8"), root);
  assert.equal(filled, '<p>x</p><script data-shared="basemap.js">\none();\n</script><script>own();</script>');
  fs.writeFileSync(page, filled);
  assert.deepEqual(stalePages(root), []);

  fs.writeFileSync(path.join(root, "shared", "basemap.js"), "two();\n");
  assert.deepEqual(stalePages(root), [path.join("a-template", "map", "index.html")]);
  fs.rmSync(root, { recursive: true, force: true });
});

test("no shared file holds a closing script tag, which would end the page's copy early", () => {
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..", "shared");
  for (const name of fs.readdirSync(dir)) {
    assert.ok(!/<\/script/i.test(fs.readFileSync(path.join(dir, name), "utf8")), name);
  }
});
