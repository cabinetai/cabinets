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
| `timeZone` | The calendar's time zone |
| `today` | The first of the seven days in `events`, `YYYY-MM-DD` |
| `canChange` | Whether the connection may change events |
| `business` | The person's name on the example only, else null |
| `headline`, `note` | One line about the week, and the one thing worth knowing |
| `events[]` | The seven days from today: `id`, `date`, `start`, `end` (24-hour `HH:MM`, null when all day), `allDay`, `lastDate`, `title`, `place`, `people`, `morePeople`, `kind` (`personal`, `team` for work, or `other`), `link` |
| `upcoming[]` | Appointments, bookings, school dates and trips in the next 30 days: `id`, `date`, `start` (or null), `title`, `place`, `kind` (`appointment`, `school`, `booking`, `travel`, `family`, `other`) |
| `dates[]` | Birthdays and anniversaries in the next 30 days: `id`, `date`, `title`, `kind` (`birthday`, `anniversary`, `other`) |
| `clients` | Always empty here; Calendar for Business uses it |

The page works the week out itself: now and next, free time (weekday evenings 17:00 to
22:00, and weekends 9:00 to 21:00), plans that overlap, and hours by kind. The example's
events are keyed by weekday: the page shows each one on the matching day of the coming
week, and plans and dates in that first week land on the same days.
