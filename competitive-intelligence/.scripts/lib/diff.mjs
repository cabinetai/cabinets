// Line-level diff via a straightforward LCS. Pages this cabinet tracks are a
// few hundred lines at most once stripped to text, so the O(n*m) table is
// cheap. The point isn't a perfect diff — it's a compact, sourced summary an
// LLM can read instead of two full page dumps.

function lcsTable(a, b) {
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i][j] =
        a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table;
}

/** Returns { added, removed }: lines present only in `after` / only in `before`. */
export function diffLines(before, after) {
  const a = before.split("\n").filter(Boolean);
  const b = after.split("\n").filter(Boolean);
  const table = lcsTable(a, b);
  const added = [];
  const removed = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      i--;
      j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      removed.unshift(a[i - 1]);
      i--;
    } else {
      added.unshift(b[j - 1]);
      j--;
    }
  }
  while (i > 0) {
    removed.unshift(a[--i]);
  }
  while (j > 0) {
    added.unshift(b[--j]);
  }
  return { added, removed };
}

/** A one-paragraph summary capped for LLM input: counts plus a few sample
 *  lines each way, not the full diff. */
export function summarizeDiff(before, after, { maxSamples = 3, maxLineLength = 160 } = {}) {
  const { added, removed } = diffLines(before, after);
  const cap = (line) => (line.length > maxLineLength ? `${line.slice(0, maxLineLength)}…` : line);
  return {
    addedCount: added.length,
    removedCount: removed.length,
    addedSample: added.slice(0, maxSamples).map(cap),
    removedSample: removed.slice(0, maxSamples).map(cap),
  };
}
