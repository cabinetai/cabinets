/*
 * The base map every template map page uses: OpenFreeMap tiles drawn by MapLibre.
 *
 * One source: shared/basemap.js at the root of the cabinets registry. A template
 * installs on its own, and a sealed app frame cannot load a file next to its page,
 * so `node .github/scripts/sync-shared.mjs` pastes this file into each page that
 * marks a place for it, and a test fails when a page holds an older copy.
 * Change this file, never a page's copy.
 *
 * A page loads MapLibre 4.7.1 from unpkg first, then marks the place with an empty
 * script element that has the attribute data-shared="basemap.js". The sync fills it.
 */
(function () {
  "use strict";

  var STYLE_URL = "https://tiles.openfreemap.org/styles/";
  // Hebrew and Arabic place names come out backwards without this plugin. It loads
  // only when a label on screen needs it.
  var RTL_TEXT = "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js";
  var LOOKS = { paper: "positron", classic: "liberty", night: "dark" };
  var ATTRIBUTION =
    '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
    '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> ' +
    'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

  // Place names in Hebrew where the map data has one, and in Latin letters
  // otherwise. Arabic shows only for a name that has no Hebrew or Latin form.
  var NAME = ["coalesce", ["get", "name:he"], ["get", "name:latin"], ["get", "name"]];
  // The map data names one area "Palestinian Territories" (country code PS). That
  // label is hidden, and Judea and Samaria is named at the middle of the area.
  var HIDDEN_COUNTRY = "PS";
  var REGIONS = [{ name: "יהודה ושומרון", at: [35.25, 32.0] }];

  function styleUrl(look) {
    return STYLE_URL + (LOOKS[look] || LOOKS.classic);
  }

  function loadRtlText() {
    try {
      if (window.maplibregl.getRTLTextPluginStatus() !== "unavailable") return;
      var loading = window.maplibregl.setRTLTextPlugin(RTL_TEXT, true);
      if (loading && loading.catch) loading.catch(function () {});
    } catch (e) {
      /* the names stay as they are */
    }
  }

  function isStateLabel(layer) {
    return layer["source-layer"] === "place" && JSON.stringify(layer.filter || "").indexOf('"state"') !== -1;
  }

  // Runs on every style load, so a change of look keeps the names.
  function localize(map) {
    var layers = map.getStyle().layers;
    var stateLabel = null;
    layers.forEach(function (layer) {
      if (layer.type !== "symbol") return;
      var field = layer.layout && layer.layout["text-field"];
      if (field && JSON.stringify(field).indexOf('"name') !== -1) map.setLayoutProperty(layer.id, "text-field", NAME);
      if (layer["source-layer"] !== "place") return;
      var keep = ["!=", ["get", "iso_a2"], HIDDEN_COUNTRY];
      map.setFilter(layer.id, layer.filter ? ["all", layer.filter, keep] : keep);
      if (!stateLabel && isStateLabel(layer)) stateLabel = layer;
    });
    if (!stateLabel || map.getSource("cabinet-regions")) return;
    map.addSource("cabinet-regions", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: REGIONS.map(function (r) {
          return { type: "Feature", properties: { name: r.name }, geometry: { type: "Point", coordinates: r.at } };
        }),
      },
    });
    map.addLayer({
      id: "cabinet-regions",
      type: "symbol",
      source: "cabinet-regions",
      minzoom: 6,
      maxzoom: 10,
      layout: { "text-field": ["get", "name"], "text-font": stateLabel.layout["text-font"], "text-size": 14 },
      paint: stateLabel.paint || {},
    });
  }

  // A flat map that pans and zooms but never tilts or turns. `options` adds to or
  // overrides MapLibre's map options (center, zoom, bounds, minZoom). Returns null
  // when MapLibre did not load or the browser cannot draw it (no WebGL).
  function create(container, look, options) {
    if (!window.maplibregl) return null;
    loadRtlText();
    var opts = {
      container: container,
      style: styleUrl(look),
      maxZoom: 18,
      maxPitch: 0,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false,
      fadeDuration: 120,
    };
    Object.keys(options || {}).forEach(function (key) {
      opts[key] = options[key];
    });
    var map;
    try {
      map = new window.maplibregl.Map(opts);
    } catch (e) {
      return null;
    }
    map.on("style.load", function () {
      try {
        localize(map);
      } catch (e) {
        /* the map keeps the names the style gives */
      }
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    return map;
  }

  // A full reload of the style, not a merge into the old one: only a full reload
  // fires style.load, which puts the names and the label back.
  function setLook(map, look) {
    map.setStyle(styleUrl(look), { diff: false });
  }

  window.CabinetBasemap = {
    ATTRIBUTION: ATTRIBUTION,
    create: create,
    setLook: setLook,
  };
})();
