# Signal Log

Append-only. Written mechanically by `.scripts/sweep.mjs`, not by hand or by the agent —
every line is a script-verified fact, not a judgment call. Format:

`date | competitor | page kind | what happened | source URL | screenshot path`

Nothing has been swept yet. This fills in once `competitors/.roster.json` has entries and
the daily sweep runs. The weekly job reads a week of this log to decide what's material
enough for the briefing; most lines here will just say "no change" and that's the point,
it's the record that nothing was missed, not a chronicle of every quiet day.
