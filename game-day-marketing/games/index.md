---
title: Games
order: 8
last_synced: null
last_score_check: null
---
# Games

One file per game for every team in [[teams]]. The Sports Desk creates and updates these files; the Promo Manager reads them to decide what to fire. `last_synced` and `last_score_check` above show when the data was last refreshed.

## File name
`YYYY-MM-DD-<team>-<opponent-slug>.md`, dated by the game in New York time. Example: `2026-10-06-rangers-islanders.md`.

## Frontmatter
| Field | Meaning |
|---|---|
| `game_id` | The league's own id, prefixed: `nhl-…` or `nba-…`. This is the key that stops a promotion firing twice. |
| `team` / `opponent` | Our team id and the opponent's name. |
| `home` | `true` for a home game. |
| `season_type` | `preseason`, `regular` or `postseason`. |
| `start` | Start time, quoted, with the New York offset (`-04:00` or `-05:00`). |
| `status` | `scheduled`, `live`, `final`, `postponed` or `cancelled`. |
| `score` | `{team, opponent}`. Empty until final. |
| `result` | `win` or `loss` from our side. Overtime and shootout losses are losses. |
| `verified` | `true` only when two sources agree on the final score and the winner. |
| `sources_checked` | Every check: `{source, checked_at, score, winner}`. |
| `weather` | `{summary, temp_c, precip_pct}`, filled on game day. |
| `promotions_fired` | `{promotion, campaign, fired_at}` for each promotion fired for this game. Never edited by hand. |

## Status flow
`scheduled` → `live` → `final`. A game becomes `verified` only after the second agreeing source.
