/**
 * What a short video looks like, written once. The Studio uses it to draw the live preview and
 * studio/render.mjs uses it to build the real video, so the two never disagree. Plain script:
 * the browser loads it as a global `Compose`, and render.mjs reads it as text.
 */
(function (root, make) {
  if (typeof module === "object" && module.exports) module.exports = make();
  else root.Compose = make();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var WORDS_PER_SECOND = 2.6;

  /** Fonts a video can use. `css` is the family, `weight` what the captions are set in. */
  var FONTS = {
    tiktok: { name: "TikTok Sans", css: "'TikTok Sans', Inter, 'Helvetica Neue', Arial, sans-serif", weight: 800, google: "TikTok+Sans:wght@800" },
    montserrat: { name: "Montserrat", css: "Montserrat, Inter, Arial, sans-serif", weight: 900, google: "Montserrat:wght@900" },
    comic: { name: "Luckiest Guy", css: "'Luckiest Guy', Impact, sans-serif", weight: 400, google: "Luckiest+Guy" },
    inter: { name: "Inter", css: "Inter, 'Helvetica Neue', Arial, sans-serif", weight: 900, google: "Inter:wght@800;900" },
    serif: { name: "Playfair", css: "'Playfair Display', Georgia, serif", weight: 800, google: "Playfair+Display:wght@800" },
    grotesk: { name: "Grotesk", css: "'Space Grotesk', Arial, sans-serif", weight: 700, google: "Space+Grotesk:wght@700" },
    condensed: { name: "Condensed", css: "'Bebas Neue', Impact, sans-serif", weight: 400, google: "Bebas+Neue" },
  };

  /**
   * How the spoken word shows. highlight: a box behind it. color: it changes colour.
   * outline: thick black edge on every word, the spoken one coloured. pill: a dark bar behind
   * the line. label: a white label behind the line, like TikTok's own text. dim: the other
   * words are faded, so the spoken one stands out.
   */
  var STYLES = ["highlight", "color", "outline", "pill", "label", "dim"];

  var KINDS = ["hook", "point", "proof", "cta"];

  var DEFAULT_LOOK = {
    preset: "karaoke",
    style: "outline",
    font: "montserrat",
    upper: true,
    size: 96,
    color: "#ffffff",
    accent: "#ffe14d",
    x: 50,
    y: 64,
    motion: true,
  };

  /**
   * One click sets a whole look. The six caption looks most used on TikTok: word-by-word
   * karaoke, the highlight box, TikTok's own classic text and its white label, the loud comic
   * look, and quiet minimal captions. Each is a partial look.
   */
  var PRESETS = {
    karaoke: { label: "Karaoke", style: "outline", font: "montserrat", upper: true, size: 96, color: "#ffffff", accent: "#ffe14d", y: 64 },
    box: { label: "Box", style: "highlight", font: "montserrat", upper: true, size: 92, color: "#ffffff", accent: "#8b5cf6", y: 58 },
    classic: { label: "Classic", style: "color", font: "tiktok", upper: false, size: 84, color: "#ffffff", accent: "#ffffff", y: 70 },
    label: { label: "Label", style: "label", font: "tiktok", upper: false, size: 76, color: "#161616", accent: "#fe2c55", y: 68 },
    hype: { label: "Hype", style: "outline", font: "comic", upper: true, size: 112, color: "#ffffff", accent: "#3ee87a", y: 52 },
    minimal: { label: "Minimal", style: "dim", font: "inter", upper: false, size: 70, color: "#ffffff", accent: "#ffffff", y: 74 },
  };

  var HEX = /^#[0-9a-f]{6}$/i;

  function clamp(n, lo, hi, fallback) {
    n = Number(n);
    if (!isFinite(n)) return fallback;
    return Math.max(lo, Math.min(hi, n));
  }

  /** A look made safe: every field has a known value, whatever was saved. */
  function resolveLook(saved) {
    var s = saved && typeof saved === "object" ? saved : {};
    var base = {};
    for (var k in DEFAULT_LOOK) base[k] = DEFAULT_LOOK[k];
    var out = base;
    // A look saved under an older preset name keeps its own fields and shows as custom.
    out.preset = PRESETS[s.preset] ? s.preset : typeof s.preset === "string" && s.preset ? "custom" : base.preset;
    var fromPreset = PRESETS[out.preset] || {};
    for (var p in fromPreset) if (p !== "label") out[p] = fromPreset[p];
    out.style = STYLES.indexOf(s.style) >= 0 ? s.style : out.style;
    out.upper = typeof s.upper === "boolean" ? s.upper : out.preset === "custom" ? false : out.upper;
    out.font = FONTS[s.font] ? s.font : out.font;
    out.size = clamp(s.size, 56, 160, out.size);
    out.color = HEX.test(s.color || "") ? s.color : out.color;
    out.accent = HEX.test(s.accent || "") ? s.accent : out.accent;
    out.x = clamp(s.x, 10, 90, out.x);
    out.y = clamp(s.y, 8, 92, out.y);
    out.motion = s.motion === false ? false : true;
    return out;
  }

  function words(text) {
    return String(text == null ? "" : text).split(/\s+/).filter(Boolean);
  }

  /** The moment each word of a caption shows, spread over the scene. */
  function timedWords(text, start, seconds) {
    var list = words(text);
    var weights = list.map(function (w) { return 1 + w.replace(/\W/g, "").length / 6; });
    var total = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
    var span = Math.min(seconds * 0.82, list.length / WORDS_PER_SECOND + 0.4);
    var t = start + 0.15;
    return list.map(function (word, i) {
      var at = t;
      t += (weights[i] / total) * span;
      return { word: word, at: at };
    });
  }

  /** The words a scene shows: exactly what the voice says, or the caption when it is silent. */
  function lineOf(scene, speak) {
    var said = scene && typeof scene.said === "string" ? scene.said.trim() : "";
    return speak && said ? said : (scene && scene.onScreen) || said || "";
  }

  /**
   * Where a voiceover actually speaks: [start, end] spans in seconds, split at its pauses.
   * `samples` is 16-bit mono PCM. Read from the audio itself, so captions land on the voice.
   */
  function speechSpans(samples, rate) {
    var win = Math.max(1, Math.round(rate * 0.01));
    var levels = [];
    var peak = 0;
    for (var i = 0; i + win <= samples.length; i += win) {
      var sum = 0;
      for (var j = i; j < i + win; j++) sum += samples[j] * samples[j];
      var rms = Math.sqrt(sum / win);
      levels.push(rms);
      if (rms > peak) peak = rms;
    }
    if (!peak) return [];
    var floor = peak * 0.07;
    var spans = [];
    var on = -1;
    var quiet = 0;
    for (var k = 0; k < levels.length; k++) {
      if (levels[k] > floor) {
        if (on < 0) on = k;
        quiet = 0;
      } else if (on >= 0 && ++quiet >= 12) {
        spans.push([on * 0.01, (k - quiet + 1) * 0.01]);
        on = -1;
        quiet = 0;
      }
    }
    if (on >= 0) spans.push([on * 0.01, (levels.length - quiet) * 0.01]);
    return spans.filter(function (s) { return s[1] - s[0] >= 0.08; });
  }

  /**
   * The part of a voice file that says the line, so every scene is timed the same way: a short
   * breath, the line, a short breath. `spans` is where the file speaks and `length` how long
   * it runs. An older Cabinet's voice reads its own instruction before the line, with a pause
   * between them: when the whole speech is too long for the words, the cut starts after the
   * longest pause. `long` means no cut fits, so the file plays whole.
   */
  function voiceCut(spans, text, length) {
    if (!spans || !spans.length) return null;
    var n = words(text).length || 1;
    var end = spans[spans.length - 1][1];
    // The slowest a line is read: one and a half words a second, plus its pauses.
    var most = n / 1.5 + 0.8;
    var k = end - spans[0][0] <= most ? 0 : -1;
    if (k < 0) {
      // The pause before the line is the longest one, so the cut starts after it when what
      // follows can be the line: not too long for the words, not too short to say them.
      var widest = 0;
      for (var i = 1; i < spans.length; i++) {
        if (spans[i][0] - spans[i - 1][1] > (widest ? spans[widest][0] - spans[widest - 1][1] : 0.3)) widest = i;
      }
      var rest = widest ? end - spans[widest][0] : 0;
      // Only a long lead-in is cut away (the instruction runs for seconds): a slow voice
      // that pauses inside its own line keeps the whole line.
      var lead = widest ? spans[widest - 1][1] - spans[0][0] : 0;
      if (widest && lead >= 3 && rest <= most && rest >= n / 6) k = widest;
    }
    var long = k < 0;
    if (long) k = 0;
    var from = Math.max(0, spans[k][0] - 0.12);
    var to = Math.min(length > 0 ? length : end + 0.25, end + 0.25);
    return {
      from: from,
      to: to,
      seconds: Math.round((to - from) * 100) / 100,
      long: long,
      spans: spans.slice(k).map(function (s) { return [s[0] - from, s[1] - from]; }),
    };
  }

  /** How long a word takes to say, roughly: its letters, more for a number read out loud. */
  function wordWeight(w) {
    var letters = w.replace(/[^\p{L}\p{N}]/gu, "");
    var digits = letters.replace(/\D/g, "").length;
    return 1.2 + (letters.length - digits) * 0.35 + digits * 1.1;
  }

  /**
   * The moment each word is said. With the voice's spans, each phrase (words up to a comma or
   * a full stop) lands in its own span when they match, else every word spreads over the
   * speech from its first sound to its last. Without spans, words spread over the scene.
   */
  function syncedWords(text, start, seconds, spans) {
    var list = words(text);
    if (!list.length) return [];
    if (!spans || !spans.length) return timedWords(text, start, seconds);
    var phrases = [];
    var cur = [];
    list.forEach(function (w, i) {
      cur.push(i);
      if (/[.,!?;:]$/.test(w) && i < list.length - 1) { phrases.push(cur); cur = []; }
    });
    if (cur.length) phrases.push(cur);
    var parts = phrases.length === spans.length ? phrases.map(function (p, n) { return { idx: p, span: spans[n] }; })
      : [{ idx: list.map(function (_, i) { return i; }), span: [spans[0][0], spans[spans.length - 1][1]] }];
    var out = [];
    parts.forEach(function (part) {
      var ws = part.idx.map(function (i) { return wordWeight(list[i]) + (part.idx.length > 1 && /[.,!?;:]$/.test(list[i]) ? 0.8 : 0); });
      var total = ws.reduce(function (a, b) { return a + b; }, 0) || 1;
      var t = part.span[0];
      var len = part.span[1] - part.span[0];
      part.idx.forEach(function (i, n) {
        out[i] = { word: list[i], at: start + t };
        t += (ws[n] / total) * len;
      });
    });
    return out;
  }

  /** Captions show a few words at a time: a page ends at punctuation or after three or four words. */
  function pages(list) {
    var out = [];
    var page = [];
    list.forEach(function (w, j) {
      page.push(j);
      var short = page.length === 3 && list.slice(page[0], j + 1).every(function (x) { return x.word.length <= 3; });
      if ((page.length >= 3 && !short) || page.length >= 4 || /[.,!?;:]$/.test(w.word)) {
        out.push(page);
        page = [];
      }
    });
    if (page.length) out.push(page);
    return out;
  }

  /** The word that carries the caption: one with a number, else the longest. */
  function keyIndex(list) {
    var n = list.findIndex(function (w) { return /\d/.test(w.word); });
    if (n >= 0) return n;
    var best = 0;
    list.forEach(function (w, i) {
      if (w.word.replace(/\W/g, "").length > list[best].word.replace(/\W/g, "").length) best = i;
    });
    return best;
  }

  /** How long a scene lasts: its voice and a breath, else the seconds the person set. */
  function sceneSeconds(scene, hasAudio) {
    var voiced = hasAudio ? Number(scene.audioSeconds) || 0 : 0;
    // A voiced scene lasts as long as its line: the line already has a breath at each end.
    return Math.max(1.5, Math.min(14, voiced ? voiced : Number(scene.seconds) || 3.5));
  }

  /** Where a scene's caption sits: its own spot if the person moved it, else the look's. */
  function captionSpot(scene, look) {
    var p = scene && scene.pos;
    var x = look.x, y = look.y;
    if (p && isFinite(p.x) && isFinite(p.y)) { x = clamp(p.x, 10, 90, look.x); y = clamp(p.y, 8, 92, look.y); }
    // Near an edge the caption narrows, so it never runs off the frame.
    return { x: x, y: y, w: Math.min(84, Math.round(Math.min(x, 100 - x) * 2 * 10) / 10) };
  }

  /**
   * The caption's CSS, in one place. `u(px)` turns a size at 1080 pixels wide into the unit the
   * caller draws in: pixels for the video, container units for the preview.
   */
  function captionCss(look, u) {
    var f = FONTS[look.font] || FONTS.inter;
    var css = [];
    var track = look.font === "condensed" || look.font === "comic" ? "0.02em" : look.upper ? "-0.01em" : "-0.025em";
    css.push(".cap{position:absolute;width:84%;text-align:center;color:" + look.color + ";font-family:" + f.css + ";font-weight:" + f.weight + ";font-size:" + u(look.size) + ";line-height:" + (look.upper ? "1.04" : "1.12") + ";letter-spacing:" + track + ";text-wrap:balance" + (look.upper ? ";text-transform:uppercase" : "") + "}");
    css.push(".cap .w{display:inline-block;padding:0 0.1em;border-radius:0.16em}");
    if (look.style === "highlight") css.push(".cap .w.on{background:" + look.accent + "}");
    if (look.style === "color") css.push(".cap .w.on{color:" + look.accent + "}");
    if (look.style === "outline") {
      css.push(".cap{-webkit-text-stroke:" + u(look.size * (look.font === "comic" ? 0.1 : 0.08)) + " #000;paint-order:stroke fill;text-shadow:0 " + u(5) + " 0 rgba(0,0,0,0.85)}");
      css.push(".cap .w.on{color:" + look.accent + "}");
    } else if (look.style === "label") {
      css.push(".cap{background:#fff;border-radius:" + u(look.size * 0.26) + ";padding:" + u(look.size * 0.14) + " " + u(look.size * 0.3) + ";width:max-content;max-width:84%}");
      css.push(".cap .w.on{color:" + look.accent + "}");
    } else {
      css.push(".cap{text-shadow:0 " + u(6) + " " + u(28) + " rgba(0,0,0,0.45)}");
    }
    if (look.style === "dim") {
      css.push(".cap .w{opacity:0.6}");
      css.push(".cap .w.on{opacity:1}");
    }
    if (look.style === "pill") {
      css.push(".cap{background:rgba(11,8,7,0.62);border-radius:" + u(look.size * 0.5) + ";padding:" + u(look.size * 0.22) + " " + u(look.size * 0.4) + ";width:max-content;max-width:84%}");
      css.push(".cap .w.on{color:" + look.accent + "}");
    }
    return css.join("\n");
  }

  /** The Google Fonts address for the fonts a look needs. */
  function fontsUrl(look) {
    var f = FONTS[look.font] || FONTS.inter;
    return "https://fonts.googleapis.com/css2?family=" + f.google + "&display=block";
  }

  /** Where a pop-out sits: the half of the frame the caption is not in. */
  function popSpot(spot) {
    return { x: 50, y: spot.y >= 46 ? 25 : 76 };
  }

  /**
   * A pop-out: one of the business's own pictures on a white card over the scene. `u` as in
   * captionCss. `.popw` places it; `.pop` is the card, which the video animates.
   */
  function popCss(u) {
    return [
      ".popw{position:absolute;transform:translate(-50%,-50%)}",
      ".pop{background:#fff;padding:" + u(14) + ";border-radius:" + u(46) + ";box-shadow:0 " + u(26) + " " + u(70) + " rgba(0,0,0,0.5);transform:rotate(-2deg)}",
      ".pop img{display:block;max-width:" + u(620) + ";max-height:" + u(600) + ";min-width:" + u(260) + ";border-radius:" + u(34) + "}",
    ].join("\n");
  }

  /** The scene kinds, in the words the person sees. */
  var KIND_LABEL = { hook: "Hook", point: "Point", proof: "Proof", cta: "Call to action" };

  return {
    FONTS: FONTS,
    STYLES: STYLES,
    KINDS: KINDS,
    KIND_LABEL: KIND_LABEL,
    PRESETS: PRESETS,
    DEFAULT_LOOK: DEFAULT_LOOK,
    resolveLook: resolveLook,
    words: words,
    timedWords: timedWords,
    syncedWords: syncedWords,
    speechSpans: speechSpans,
    voiceCut: voiceCut,
    lineOf: lineOf,
    pages: pages,
    keyIndex: keyIndex,
    sceneSeconds: sceneSeconds,
    captionSpot: captionSpot,
    captionCss: captionCss,
    popSpot: popSpot,
    popCss: popCss,
    fontsUrl: fontsUrl,
    clamp: clamp,
  };
});
