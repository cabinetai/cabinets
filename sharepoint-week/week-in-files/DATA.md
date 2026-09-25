---
title: What the weekly look writes
---
# What the weekly look writes

The Week in Files app shows one file: `week-in-files/data/latest.json`. The routine
writes it, the app only reads it. `week-in-files/data/EXAMPLE-latest.json` is a made-up
example in the same shape; the app shows it, labelled as an example, until the first
real `latest.json` exists. Never edit the example to hold real files.

The routine writes `latest.json` in one go. The app reads it again whenever it changes.

```jsonc
{
  "version": 1,
  "generatedAt": "2026-09-21T08:02:00+03:00", // when you wrote it, with the time zone
  "from": "2026-09-14T08:02:00+03:00",        // the start of the 7 days you looked at
  "to": "2026-09-21T08:02:00+03:00",          // the end (usually the same as generatedAt)
  "status": "ok",                             // "ok", or "problem" when the folders could not be read
  "problem": null,                            // one plain sentence when status is "problem", else null
  "way": "folder",                            // "folder" (the OneDrive app's folders) or "tools"
  "folders": ["Company Files"],               // the names of the SharePoint folders you read
  "total": 15,                                // every file changed in those 7 days, even when the list is cut
  "lead": {                                   // the one file worth a look first, or null
    "name": "Price list 2026",
    "why": "One short sentence on why. Never quote what the file says."
  },
  "settings": {                               // copied from week-in-files/setup.md
    "you": null,                              // the person's own name at work, or null
    "first": ["Price lists", "Orders"],       // folders that matter most (may be empty)
    "skip": ["Archive"]                       // folders left out (may be empty)
  },
  "changes": [                                // newest first, at most 60
    {
      "name": "Price list 2026",              // the file name without its extension
      "ext": "xlsx",                          // the extension, lower case, no dot
      "folder": "Sales/Price lists",          // where it sits inside the SharePoint folder ("" at the top)
      "library": "Company Files",             // which SharePoint folder it came from (one of "folders")
      "changedAt": "2026-09-17T14:32:00+0300", // when it last changed, with the time zone, as listed
      "by": "Dana Arbel",                     // who saved it last, or null when the file does not say
      "isNew": false,                         // true only when it was clearly made in these 7 days
      "path": "../../home/Company Files/Sales/Price lists/Price list 2026.xlsx",
                                              // the file's path relative to this cabinet's folder,
                                              // exactly as you read it; null when there is none
      "link": null                            // a web address only when your tools gave you one; never build one
    }
  ]
}
```

## The rules behind the fields

- **The listing.** The routine's own instructions hold one read-only command that prints,
  for every file changed in the 7 days, its path, when it changed, when it was made and
  who saved it last. `path`, `changedAt` and `by` are copied from it as printed.
- **`by`** comes from the file itself. Word, Excel and PowerPoint files (`.docx`, `.xlsx`,
  `.pptx` and their `m` versions) keep who saved them last in `docProps/core.xml`, in the
  `<cp:lastModifiedBy>` field: `unzip -p "<file>" docProps/core.xml` shows it. Read that
  field and nothing else. Every other kind of file has no name: write `null`. Never guess.
- **`isNew`** is true only when the file's creation date falls inside the 7 days. When most
  files in a folder share one creation time, that is when the OneDrive app brought them to
  this computer, not when anyone made them: leave `isNew` false for all of them.
- **`lead`** prefers a folder from `settings.first`. Skip it (write `null`) on a week where
  nothing stands out.
- **A quiet week** is `"status": "ok"`, `"total": 0` and an empty `changes` list. It is a
  real answer, not a problem.
- **A problem** keeps `changes` empty and says in `problem`, in one plain sentence, what
  could not be read. The app shows that sentence to the person as it is.
- Hidden files, folders and Office's temporary files (names starting with `~$`) are never
  changes.

## The page people read

Each look also writes `past-weeks/<YYYY-MM-DD>.md` (today's date; a second look on the
same day replaces that day's page). It says the same thing in plain sentences: how many
files changed, the one to look at first, then the files by folder with who and when.
Frontmatter holds only `title`, for example `title: 14 to 21 September 2026`.
