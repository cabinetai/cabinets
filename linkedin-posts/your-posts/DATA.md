---
title: How Your posts gets its words
---
# How Your posts gets its words

The page never talks to LinkedIn. It reads what the agent wrote in this cabinet and shows
it. The full rules are in the agent's persona (`.agents/post-writer/persona.md`).

LinkedIn lets apps like Cabinet read only the person's name and picture, and post, comment or
like as them. It shares no posts, comments, reactions or numbers. So the page has no box for
how a post did: it shows the drafts, their status, and the week's ideas. The person's past
posts come in only from LinkedIn's copy of their data, which they ask LinkedIn for themselves;
the agent writes them in `imports/`, and the page does not show them.

| File | Written by | What it holds |
|---|---|---|
| `../drafts/<YYYY-MM-DD>-<words>.md` | Post Writer, in a chat, only when asked | One post each. Frontmatter `title`, `status` (`draft`, `approved` or `posted`), `created`, `audience` (`everyone` or `connections`), and once it is on LinkedIn `posted_urn` and `posted_date`. Under it, exactly the words of the post. |
| `../ideas/<YYYY-MM-DD>.md` | Weekly post ideas, every Monday at 9 | Three ideas, each a `## ` title, a line or two on the angle, and a `From:` line naming the note it comes from. The page shows the newest page. |
| `../imports/<YYYY-MM-DD>-posts.md` | Post Writer, in a chat, only when asked ("Bring in my LinkedIn posts") | The person's past posts and articles from their LinkedIn export, newest first. Frontmatter `title`, `created`, `status: posted`, `source: export`; then each post a `## <date> <first words>` head, a line with the day, who saw it and its link, and its words. `-comments.md` and `-reactions.md` sit beside it only when asked for by name. The export itself (the .zip or its folder, put there by the person) stays in `imports/`. The export's files and columns are not fixed, so the agent finds them by the words in their names (share, post, article, comment, reaction) and says what it found. The page reads none of it. What I shipped this week, Three takes on a draft and Month in review read these past posts as the person's own voice and history; Month in review counts what they posted that month next to their notes. |
| `data/EXAMPLE-posts.json` | Nobody (it ships with the template) | Made-up drafts and ideas, each page written out as the agent would write it, so the page reads them the same way. Shown, marked as an example, until LinkedIn is connected, and only while the cabinet has no drafts or ideas of its own. Schema `linkedin-posts/example@1`. |
| `data/layout-change.json` | The agent, in a chat | Boxes someone asked to `add` or `remove`, with `at`, `for` and a `note`. Schema `linkedin-posts/layout-change@1`. The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet (`cabinet.mine`), not in a file. |

The page reads the 40 newest drafts by file name. A status it does not know reads as a
draft. A `posted_urn` is shown only when it is a LinkedIn post id (`urn:li:share:...`,
`urn:li:ugcPost:...` or `urn:li:activity:...`), and becomes an "Open on LinkedIn" link.

The list puts approved drafts first (ready to publish), then drafts, then posted ones, the
newest first in each. Opening one shows the whole post and its presses: Publish this (an
approved draft, only for the cabinet's owner, since a post goes out as the person who
connected LinkedIn), Polish it, Three variants, It's final, Write a follow-up, Copy.

Nothing on the page writes a file or publishes. Every press asks Post Writer in the chat.
Publish this asks it to show the exact final text and who will see it and to wait for a
yes; the post goes out only after that yes, from the chat. Routines never publish, and
Cabinet refuses a post from anything but a chat the person started.

The page is a 12-column grid of boxes on LinkedIn's warm grey, laid out like the digests:
Headline, Your drafts, Ideas for your next posts, Ideas for your posts, Keep your LinkedIn posts
in Cabinet (the setup guide's four steps for bringing in past posts from LinkedIn's copy of the
person's data, by their heads, no data, with a Show me how button that opens them in full in a
side panel) and Ask about your posts to start with, and more to add (the numbers Drafts,
Approved, Posted, and each idea as its own box). The connection, New ideas (runs the weekly routine now), Ideas and Layout sit in
the headline; without the headline they move to a slim bar on top. Each person moves,
resizes, adds and removes boxes (mouse, finger or keyboard, with Undo), or asks the agent
through Layout, which answers with `layout-change.json`. Keep your LinkedIn posts in Cabinet is
on the first page for someone new; a layout saved before it came gets it from Add a box.

The setup guide's four steps (Me then Settings and Privacy, Data privacy then Get a copy of your
data, the files to pick and Request archive, the email and the imports folder) each carry a
picture of the real screen (LinkedIn's, the email's, Cabinet's) redrawn as a small SVG with a
made-up account, Maya Levi. The pictures are drawn by the page's own script in `index.html`, so
they show on Cloud too. The Ask box has "Bring in my LinkedIn posts" among its questions.

The headline says what is approved and ready, the newest draft, and the last post that went
out, with the drafts by status on the right. "LinkedIn connected" names the account only when
Cabinet tells the page who signed in; the cabinet never saves that name.

The first time someone who can ask the agent opens the page with LinkedIn connected, the band
says "Signed in to LinkedIn" (with the name when Cabinet gives it), that LinkedIn lets Cabinet
post but not read the feed so there is nothing to catch up on, and offers Write your first post
and Got it. Got it, or starting any new draft, puts it away for that person for good
(`linkedin-posts-first-done@1` in `cabinet.mine`), even if LinkedIn is later disconnected and
connected again. No agent runs for it.
