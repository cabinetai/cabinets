# What the Calendar Brief app reads

The morning routine (`.jobs/morning-calendar-brief.yaml`) writes `data/latest.json` in
this folder and the app draws it. Until the first real update the app shows
`data/EXAMPLE-latest.json`, a made-up heating and cooling company, and labels it as an
example. The routine also keeps one page per client in `../clients/`; the app does not
read those.

`data/latest.json`:

| Field | What it holds |
|---|---|
| `generatedAt` | When the calendar was read (ISO time with offset), or null if never |
| `checkedAt` | When the routine last tried |
| `status` | `ok`, or one plain sentence on what went wrong; everything else is then the last good read |
| `timeZone` | The calendar's time zone |
| `today` | The first of the seven days in `events`, `YYYY-MM-DD` |
| `canChange` | Whether the connection may change events: true only for Sign in with Google with change allowed, false when read only (the secret address always is) |
| `business` | The person's own business name when the calendar shows it, else null |
| `headline` | One line about the week in business |
| `note` | Optional: the one thing worth acting on |
| `events[]` | The seven days from today: `id`, `date`, `start`, `end` (24-hour `HH:MM`, null when all day), `allDay`, `lastDate` (multi-day all-day only), `title`, `place`, `people` (names, at most three), `morePeople`, `kind`, `client`, `link` |
| `clients[]` | Everyone outside the business met in the last 90 days or booked in the next 30: `id`, `name` (company, or the person when there is none), `contact`, `meetings90`, `firstMet`, `lastMet`, `next` (`{date, start, title}` or null), `hoursMonth`, `status` |

The routine also keeps what it needs for the next morning, so each run reads only the
new days instead of 90 days again: `readThrough` (the last day already read), `rules` (its
decisions: the business's own domains, who is not a client, company names) and, on each
client, `met` (the client meetings of the last 90 days, as date, minutes and event id). The
app ignores these three.

`kind` is `client` (a meeting with someone from outside the business), `team`, `personal`
or `other` (suppliers, advisers, anything else). A client meeting's `client` is the `id`
of its row in `clients`. `status` is `new` (first met this month, or booked for the first
time), `quiet` (no meeting in the last 45 days and none booked) or `active`. Dates are the
calendar's own days; `hoursMonth` counts client meeting time since the 1st of this month.

The app works out the week's numbers itself (client meetings, hours with clients, new
clients) and the best open time for sales calls: the longest free stretch between 8:00
and 17:00 on a weekday. The example's events are keyed by weekday: the app shows each one
on the matching day of the coming week.
