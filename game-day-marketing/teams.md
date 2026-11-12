---
title: Teams
order: 6
teams:
  - id: rangers
    name: New York Rangers
    league: nhl
    venue: Madison Square Garden
    home_venue_match: Madison Square Garden
    season: October to April (playoffs into June)
    sources:
      primary: https://api-web.nhle.com/v1/club-schedule/NYR/week/now
      secondary: https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/nyr/schedule
  - id: knicks
    name: New York Knicks
    league: nba
    venue: Madison Square Garden
    home_venue_match: Madison Square Garden
    season: October to April (playoffs into June)
    sources:
      primary: https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/ny/schedule
      secondary: web search for the official box score (nba.com or the team's site)
weather:
  lat: 40.7505
  lon: -73.9934
  primary: https://api.open-meteo.com/v1/forecast
  secondary: https://api.weather.gov/points/40.7505,-73.9934
---
# Teams

The teams this shop follows. The Sports Desk reads this page to know which schedules to sync and where to check scores. Add a team by adding an entry to the `teams` list; nothing else needs to change.

> Example setup for a shop two blocks from Madison Square Garden. Replace with the teams that move your customers.

## New York Rangers (NHL)
Home games at Madison Square Garden, roughly 41 a season from October to April, usually at 7:00 pm. Hockey nights bring pre-game crowds down 8th Avenue from about 5:30 pm.

## New York Knicks (NBA)
Home games at Madison Square Garden, roughly 41 a season from late October to April, usually at 7:30 pm. The busiest nights of the year when the team is winning.

## Sources
| Team | Primary | Secondary | Notes |
|---|---|---|---|
| Rangers | NHL official API | ESPN public JSON | NHL API gives venue and game state (`FUT`, `LIVE`, `OFF`). Follow redirects. |
| Knicks | ESPN public JSON | Official box score via web search | ESPN gives `completed` and `winner` per team. NBA's own CDN refuses direct requests. |
| Weather | Open-Meteo (no key) | National Weather Service | NWS needs a User-Agent header. |

**Rules**
- A win counts only when two sources agree on the final score and the winner.
- If a source fails, search the web for the official box score. If that does not give the final score explicitly, leave the game unverified. Never guess.
- ESPN's JSON is public but undocumented and could change. If it breaks, the fallback above keeps things honest.
