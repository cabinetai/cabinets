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
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    return map;
  }

  window.CabinetBasemap = {
    LOOKS: LOOKS,
    ATTRIBUTION: ATTRIBUTION,
    styleUrl: styleUrl,
    create: create,
  };
})();
