// shared/basemap.js rewrites OpenFreeMap's styles before MapLibre draws them:
// Hebrew place names, no "Palestinian Territories" label, and a Judea and Samaria
// label. These tests run that rewrite on copies of the three styles, so a change
// in how OpenFreeMap writes them fails here instead of on the map.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { ROOT } from "../sync-shared.mjs";

const FIXTURES = path.join(ROOT, ".github", "scripts", "test", "fixtures");
const LOOKS = ["positron", "liberty", "dark"];
const NAME = ["coalesce", ["get", "name:he"], ["get", "name:latin"], ["get", "name"]];

function basemap() {
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "shared", "basemap.js"), "utf8"), { window });
  return window.CabinetBasemap;
}

const readsName = (layer) => JSON.stringify(layer.layout?.["text-field"] ?? "").includes('"name');

for (const look of LOOKS) {
  const style = JSON.parse(fs.readFileSync(path.join(FIXTURES, `openfreemap-${look}.json`), "utf8"));
  const before = JSON.stringify(style);
  const out = basemap().localizeStyle(style);
  const byId = new Map(out.layers.map((l) => [l.id, l]));

  test(`${look}: every label that showed a name shows the Hebrew-first name`, () => {
    const named = style.layers.filter((l) => l.type === "symbol" && readsName(l));
    assert.ok(named.length > 5, "the style still has name labels");
    for (const layer of named) assert.deepEqual(JSON.parse(JSON.stringify(byId.get(layer.id).layout["text-field"])), NAME, layer.id);
  });

  test(`${look}: every place label skips the PS country point`, () => {
    const places = out.layers.filter((l) => l["source-layer"] === "place");
    assert.ok(places.length > 3, "the style still has place labels");
    for (const layer of places) assert.ok(JSON.stringify(layer.filter).includes('["!=",["get","iso_a2"],"PS"]'), layer.id);
  });

  test(`${look}: Judea and Samaria is labelled in a font the style has`, () => {
    const region = byId.get("cabinet-regions");
    assert.ok(region, "the label layer is added");
    assert.equal(out.sources["cabinet-regions"].data.features[0].properties.name, "יהודה ושומרון");
    const fonts = new Set(style.layers.flatMap((l) => l.layout?.["text-font"] ?? []));
    for (const font of region.layout["text-font"]) assert.ok(fonts.has(font), font);
  });

  test(`${look}: the downloaded style is left as it came`, () => {
    assert.equal(JSON.stringify(style), before);
  });
}

test("a change of look runs the same rewrite", () => {
  const calls = [];
  const map = { setStyle: (url, options) => calls.push({ url, options }) };
  basemap().setLook(map, "night");
  assert.equal(calls[0].url, "https://tiles.openfreemap.org/styles/dark");
  const style = JSON.parse(fs.readFileSync(path.join(FIXTURES, "openfreemap-dark.json"), "utf8"));
  assert.ok(calls[0].options.transformStyle(undefined, style).layers.some((l) => l.id === "cabinet-regions"));
});
