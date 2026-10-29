---
title: How the Answer Book gets your answers
---
# How the Answer Book gets your answers

The page never talks to Slack. The Answer Keeper reads Slack on a schedule and writes plain
markdown files in this cabinet, and the page shows them. The rules for every field are in
the agent's persona (`.agents/answer-keeper/persona.md`). In Cabinet the page reads these
files through the app bridge, so it works for everyone the cabinet is shared with, and it
repaints when a routine writes.

| File | Written by | What it holds |
|---|---|---|
| `answers/topics/<slug>.md` | Nightly Answer Sweep, every night at 2, and the Answer Keeper when you ask about an answer | One page per question the team settled in Slack. Edited in place, never renamed, never deleted. |
| `answers/<YYYY-MM-DD>T<HH-MM-SS>-sweep.md` | Nightly Answer Sweep | One log per run: what that run changed. Add only. The newest one gives the headline, the Worth pinning mark and the Changed in the last sweep filter. |
| `answers/EXAMPLE-sweep.md`, `answers/topics/EXAMPLE-*.md` | Nobody (they ship with the template) | A made-up team (Northwind) in the same shapes. Shown, marked as an example, until the first sweep that reaches Slack, which deletes them. |
| `faq-canvas.md` | You (`channel`), or the Answer Keeper when you choose a channel in the chat; Weekly FAQ Canvas (the other lines) | Whether the Slack canvas is on, where, its link, when it was last written, and why not if it was not. |
| `handbook/<slug>.md` | The Answer Keeper, when you press Turn this into a doc page | An answer written up as a doc page, linked from its topic page. The page does not show these; Cabinet's sidebar and search do. |

A topic page in short: frontmatter `title` (the question), `asked` (a whole number),
`state` (`Settled`, `Shifting` or `Open`), `first` and `confirmed` (`YYYY-MM-DD`),
`channel` (`"#name"`) and `url` (the best thread), then the sections `## Answer`,
`## It used to be` (only when it shifted), `## Also asked as` and `## Sources`. Any other
section, such as `## Notes` or `## Written up in`, is shown as it is.

A sweep log in short: frontmatter `headline`, `lead`, `pin`, `verdict` (the last three
only when one question keeps coming back), `source`, `generated` (`YYYY-MM-DD HH:MM`) and
`status` (`ok`, or what went wrong), then a table `| Topic | Change | URL |` where `Change`
is `New`, `Asked again` or `Updated`.

What the page asks for never changes Slack by itself. Next steps under an answer, Ideas and
the ask box send a question to the Answer Keeper in the chat beside the page, and anything
posted to Slack waits for your yes there. The routine's last and next run, and the Slack
connection, come from Cabinet itself. Your Layout choices are kept for you alone, in
Cabinet, not in these files.
