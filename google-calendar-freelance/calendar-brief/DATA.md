# What the Your week page reads

The morning routine (`.jobs/morning-calendar-brief.yaml`) writes `data/latest.json` in
this folder and the app draws it. Until the first real update the app shows
`data/EXAMPLE-latest.json`, a made-up person's week, and labels it as an example. The
routine also keeps one page per person or company in `../people/` (`../clients/` in a
cabinet set up before); the page does not read those.

`data/latest.json`:

| Field | What it holds |
|---|---|
| `generatedAt` | When the calendar was read (ISO time with offset), or null if never |
| `checkedAt` | When the routine last tried |
| `status` | `ok`, or one plain sentence on what went wrong; everything else is then the last good read |
| `timeZone` | The calendar's time zone |
| `today` | The first of the seven days in `events`, `YYYY-MM-DD` |
| `canChange` | Whether the connection may change events: true only for Sign in with Google with change allowed, false when read only (the secret address always is) |
| `business` | A business name only when the calendar plainly is a business's, else null; the page shows it on the example |
| `headline` | One line about the week (the page writes its own from the events) |
| `note` | Optional: the one thing worth knowing |
| `events[]` | The seven days from today: `id`, `date`, `start`, `end` (24-hour `HH:MM`, null when all day), `allDay`, `lastDate` (multi-day all-day only), `title`, `place`, `people` (names, at most three), `morePeople`, `kind`, `client`, `link` |
| `clients[]` | The people you meet: everyone outside your own circle met in the last 90 days or booked in the next 30: `id`, `name` (company, or the person when there is none), `contact`, `meetings90`, `firstMet`, `lastMet`, `next` (`{date, start, title}` or null), `hoursMonth`, `status` |

The routine also keeps what it needs for the next morning, so each run reads only the
new days instead of 90 days again: `readThrough` (the last day already read), `rules` (its
decisions: the person's own domains, who is not someone to keep in touch with, company
names) and, on each row of `clients`, `met` (its meetings of the last 90 days, as date,
minutes and event id). The
app ignores these three.

`kind` is `client` (a meeting with someone from outside the person's own circle; the key
keeps its first name), `team`, `personal` or `other` (services, appointments, anything
else). A meeting with others has its row's `id` in `client`. `status` is `new` (first met this month, or booked for the first
time), `quiet` (no meeting in the last 45 days and none booked) or `active`. Dates are the
calendar's own days; `hoursMonth` counts meeting time with them since the 1st of this month.

The page works the week out itself: now and next, free time (the free stretches between
8:00 and 17:00 on weekdays), events that overlap, and hours by kind. The example's events
are keyed by weekday: the page shows each one on the matching day of the coming week.

`data/layout-change.json` is written by the agent in a chat: boxes someone asked to `add`
or `remove`, with `at`, `for` and a `note`. Schema `google-calendar-freelance/layout-change@1`.
The page offers it with Apply and No thanks; each person's layout itself stays in Cabinet,
not in a file.
