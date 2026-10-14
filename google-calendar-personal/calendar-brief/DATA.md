# What the My week page reads

The morning routine (`.jobs/morning-calendar-brief.yaml`) writes `data/latest.json` in
this folder and the app draws it. Until the first real update the app shows
`data/EXAMPLE-latest.json`, a made-up person's week, and labels it as an example.

`data/latest.json`:

| Field | What it holds |
|---|---|
| `generatedAt` | When the calendar was read (ISO time with offset), or null if never |
| `checkedAt` | When the routine last tried |
| `status` | `ok`, or one plain sentence on what went wrong; everything else is then the last good read |
| `timeZone` | The calendar's time zone: every date and time in the file is in it, and the page names it when it shares free times (it shows the times as written, without converting them) |
| `today` | The first of the seven days in `events`, `YYYY-MM-DD` |
| `canChange` | Whether the connection may change events |
| `business` | The person's name on the example only, else null |
| `headline`, `note` | One line about the week, and the one thing worth knowing |
| `events[]` | The seven days from today: `id`, `date`, `start`, `end` (24-hour `HH:MM`, null when all day), `allDay`, `lastDate` (multi-day all-day only), `endDate` (a timed event that ends on a later day: the day `end` is on), `eventType` (when not `default`, such as `outOfOffice`), `transparency` (`transparent` when shown as free), `title`, `place`, `people`, `morePeople`, `kind` (`personal`, `team` for work, or `other`), `link` |
| `upcoming[]` | Appointments, bookings, school dates and trips in the next 30 days: `id`, `date`, `start` (or null), `title`, `place`, `kind` (`appointment`, `school`, `booking`, `travel`, `family`, `other`) |
| `dates[]` | Birthdays and anniversaries in the next 30 days: `id`, `date`, `title`, `kind` (`birthday`, `anniversary`, `other`) |
| `clients` | Always empty here; Calendar for Business uses it |

The page works the week out itself: now and next, free time (weekday evenings 17:00 to
22:00, and weekends 9:00 to 21:00), plans that overlap, and hours by kind. A timed event
that ends on a later day takes the rest of its first day, every day between and its last
day until `end`; an all-day event or an out-of-office takes the whole day; an event shown as
free (`transparency` `transparent`) or a birthday takes no time. The example's
events are keyed by weekday: the page shows each one on the matching day of the coming
week, and plans and dates in that first week land on the same days.

`data/layout-change.json` is written by the agent in a chat, when someone asks it to
change the boxes: the box ids to `add` or `remove`, with `at`, `for` and a `note`. Schema
`google-calendar-personal/layout-change@1`. The page offers it with Apply and No thanks; each
person's layout itself stays in Cabinet, not in a file.

`data/reading.json` and `data/profile.json` are written once, by the first read. `reading.json` is `{ startedAt, done, lines[] }`: one short line for each thing found, `**bold**` for the finding, shown as they come instead of a spinner (schema `google-calendar-personal/reading@1`). `profile.json` is what the first read learned (schema `google-calendar-personal/profile@1`): `events90`, `perWeek`, `busiestDay`, `workHours { from, to }`, `people[]`, `peopleMore`, `quiet`, `nextFree`, and per template `othersHoursWeek`, `freeEvenings`, `dates30`, `hoursMonth`, `topClient { name, hours }`. Every number is counted from the calendar, never estimated. The page shows it once, with That's right and Fix something.
