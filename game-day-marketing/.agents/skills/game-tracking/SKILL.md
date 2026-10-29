---
name: game-tracking
description: Sync home-team game schedules, record final scores and verify wins from two public sources into the cabinet's games/ folder, and fill game-day weather. Use for a schedule sync, a final score check, or any "did we win / when do we play" question.
---

# Game tracking

Keep `/games/` an exact, verified record of every game for the teams in `/teams.md`. Other agents fire promotions from these files, so a wrong "win" costs real money. Accuracy beats speed.

## Inputs
- `/teams.md`: the `teams` list (ids, league, venue, `home_venue_match`, `sources`) and `weather` (lat, lon, sources).
- `/games/index.md`: the file schema, plus `last_synced` and `last_score_check`.

## Reading the sources

### NHL official API (hockey primary)
- URL: the team's `sources.primary`, e.g. `https://api-web.nhle.com/v1/club-schedule/NYR/week/now`. **Follow redirects** (`curl -sL`).
- Each entry in `games[]`:
  - `id` → `game_id: nhl-<id>`
  - `gameType`: `1` preseason, `2` regular, `3` postseason
  - `startTimeUTC` → convert to New York time with its offset (`-04:00` in daylight time, `-05:00` otherwise)
  - `homeTeam.abbrev` / `awayTeam.abbrev`, plus `score` when present
  - `venue.default`: the game is `home: true` when it contains the team's `home_venue_match`
  - `gameState`: `FUT` or `PRE` → `scheduled`; `LIVE` or `CRIT` → `live`; `OFF` or `FINAL` → `final`
- Opponent name: `placeName.default` + `commonName.default` of the other team when available, otherwise its abbreviation.

### ESPN public JSON (basketball primary, hockey secondary)
- URL: the team's `sources` entry, e.g. `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/ny/schedule`.
- Each entry in `events[]`:
  - `id` → `game_id: nba-<id>` for basketball. For hockey, ESPN is only a cross-check: match it to the NHL game by date and opponent, and never use the ESPN id as `game_id`.
  - `date` (UTC) → New York time with offset
  - `season.type`: `1` preseason, `2` regular, `3` postseason
  - `competitions[0].status.type.completed`: `true` means final
  - `competitions[0].competitors[]`: `homeAway`, `team.abbreviation`, `team.displayName`, `score` (a string or `{displayValue}`), `winner` (`true` or `false`)
  - `competitions[0].venue.fullName` for the venue
- This JSON is public but undocumented. If the shape is different from the above, stop using it for this run and use the fallback.

### Fallback (any source fails)
Search the web for the official box score (league site or team site). It counts as a source only if the page states the final score explicitly. Record it as `{source: "web:<domain>", ...}`.

### Weather (game day only)
- Open-Meteo: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&daily=temperature_2m_max,precipitation_probability_max,weather_code&timezone=America/New_York&forecast_days=2`
- Take today's values. `summary` is a short phrase from the weather code ("clear", "cloudy", "rain", "snow"). `temp_c` is the daily max. `precip_pct` is the max precipitation probability.
- Backup: the NWS `points` URL in `/teams.md`, then its `forecast` link. Send a `User-Agent` header.

## Procedure A: schedule sync
1. For each team in `/teams.md`, read its schedule from the primary source.
2. Keep games from **yesterday** through the next 7 days (New York dates). Including yesterday means a game that was never synced in advance still gets a file in time for the night's score checks and the morning Promo Check.
3. For each game, find the file with the same `game_id` in `/games/`.
   - **Exists:** update `start`, `status`, `season_type`, `home`, `opponent` if they changed. Never touch `score`, `result`, `verified`, `sources_checked` or `promotions_fired` during a sync.
   - **New:** create `/games/YYYY-MM-DD-<team>-<opponent-slug>.md` from the template below.
4. A game that has disappeared from the schedule is not deleted. Set `status: postponed` and add a dated line to the body.
5. Set `last_synced` in `/games/index.md` to the current time (ISO, New York offset).

## Procedure B: final score check
1. Select games whose New York date is today or yesterday and whose `status` is not `final`, plus any `final` game with `verified: false`.
2. For each, query the primary source, then the secondary. Append one entry per source to `sources_checked`:
   `{source: nhl|espn|web:<domain>, checked_at: <ISO>, score: "<team>-<opponent>", winner: <team id or opponent name>}`
3. If the primary says the game is final, set `status: final`, fill `score: {team, opponent}`, and set `result` to `win` or `loss` from our team's side. Overtime and shootout losses are losses.
4. Set `verified: true` **only** when at least two different sources in `sources_checked` agree on both the final score and the winner. If they disagree, leave `verified: false` and add a dated body line describing the disagreement.
5. Set `last_score_check` in `/games/index.md`.
6. Report every game that became `verified: true` with `result: win`, by `game_id`. Do not message anyone: the Promo Check job reads verified wins straight from these files.

## Procedure C: game-day weather
For each `home: true` game today, fill `weather` using the weather source. Do not change anything else.

## Game file template
```markdown
---
game_id: nhl-0000000000
team: rangers
opponent: New York Islanders
home: true
season_type: regular
start: '2026-10-06T19:00:00-04:00'
status: scheduled
score: { team: null, opponent: null }
result: null
verified: false
sources_checked: []
weather: { summary: null, temp_c: null, precip_pct: null }
promotions_fired: []
---
# Rangers vs New York Islanders

- Home game at Madison Square Garden, 7:00 pm.
- Anything that matters to the shop: rivalry, late finish, playoff stakes.
```
Always quote `start` so it stays a string with its offset.

## Rules
- Never guess a score, a winner or a start time. Unknown stays `null` or `scheduled`.
- Write only inside `/games/`. Never fire, plan or edit promotions or campaigns.
- One file per `game_id`. Before creating a file, search `/games/` for that `game_id`.
- End every run with a short report: games added, games updated, games that went final, newly verified wins (`game_id`, score), and any source that failed.
