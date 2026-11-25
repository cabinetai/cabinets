// What a setup's record is worth, in one word, so the Scout does not have to weigh the
// numbers itself. A record is a slice of setups.json: a setup overall, or under one stance
// of the market. It is judged beside the yardstick's record for the same slice.

// When a record says something. Under MIN_CLOSED finished calls, luck decides. A setup
// `pays` only when its average result beats the yardstick's by more than EDGE (in R, the
// risk taken), so a hair's width is not called an edge. It `fails` as soon as it is under
// the yardstick: a reason to act that does worse than no reason is not worth acting on.
const MIN_CLOSED = 30, EDGE = 0.05;

/** `pays`, `fails` or `unproven`, for one slice `own` beside the yardstick's slice `base` (both as `tally` counts them). */
export function verdictOf(own, base) {
  if (own.closed < MIN_CLOSED || base.avgR == null) return "unproven";
  // Both averages are kept to two decimals, so the difference is taken in hundredths.
  const ahead = Math.round((own.avgR - base.avgR) * 100);
  return ahead > EDGE * 100 ? "pays" : ahead < 0 ? "fails" : "unproven";
}

/**
 * The verdict a call of `setup` is judged by when the market's stance is `stance`: that
 * stance's own when it says something, the setup's overall when the stance's is unproven
 * (or `stance` is not known). `record` is setups.json. Carries the numbers behind it:
 * `{ verdict, verdictFrom: "stance" | "overall", closed, avgR, anyAvgR }`. Null for a name
 * that is not a setup.
 */
export function verdictFor(record, setup, stance) {
  // A model writes the name: "constructor" is on every object, so only an own key counts.
  if (!Object.hasOwn(record.setups, setup)) return null;
  const own = record.setups[setup];
  const at = own.byStance[stance];
  const [slice, base, verdictFrom] = at && at.verdict !== "unproven" ? [at, record.any.byStance[stance], "stance"] : [own, record.any, "overall"];
  return { verdict: slice.verdict, verdictFrom, closed: slice.closed, avgR: slice.avgR, anyAvgR: base.avgR };
}
