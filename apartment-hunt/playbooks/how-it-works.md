---
title: How it works
created: '2026-11-23T00:00:00Z'
modified: '2026-11-23T00:00:00Z'
tags: [playbooks, rules]
---
# How it works

Where everything is kept, and the exact shapes the Scout writes. The map reads these files,
so a key spelled wrong is a fact the person never sees.

## The files

| File | Who writes it | What it is |
|---|---|---|
| `search/brief.md` | The Scout, after the interview. The person may edit it. | What the person is looking for. |
| `listings/<name>.md` | The Scout | One apartment worth a look. |
| `search/runs.json` | The Scout, at the end of every search | What each search looked at and found. |
| `search/market.md` | The Scout, once a week | The market read for the person's areas. |
| `hunt/.data/shared.json` | The map (Cabinet keeps it) | What the person did on the map. Read only. |
| `search/EXAMPLE-il-*`, `search/EXAMPLE-us-*`, `listings/EXAMPLE-il-*`, `listings/EXAMPLE-us-*` | Ship with the cabinet | Made-up examples, one set per country. |

**Examples.** The map shows the `EXAMPLE-` files only while `search/brief.md` does not exist.
Never count them, never compare with them, never write about them as real. Ignore the
`l:EXAMPLE-` entries in the map's store too: they are the person trying the buttons. Never
delete the examples unless the person asks.

## The brief: `search/brief.md`

Frontmatter on top, then the brief in the person's own words.

```
---
status: ready
country: il
deal: rent
who: A couple and a small dog. Both work from home two days a week.
cities: Tel Aviv, Givatayim
neighborhoods: Lev HaIr, Kerem HaTeimanim, Florentin, Borochov
price_max: 7500
price_ideal: 6800
rooms_min: 3
rooms_max: 3.5
size_min: 65
floor_max: 4
move_in: 2027-01-15
must: mamad, elevator, pets
nice: balcony, renovated, parking
never: ground_floor, no_window_bedroom
broker: ok
anchor_work: Azrieli Center | 32.0745, 34.7920
anchor_family: Her parents, Givatayim | 32.0717, 34.8106
updated: 2026-11-23
---
```

- `status`: `draft` while the interview is still going, `ready` once the person said the
  brief is right. The search routine only runs on `ready`.
- `country`: `il` (Israel) or `us` (the United States). It decides the money, the units,
  the sites, and which of `israel.md` or `united-states.md` you read. US briefs add `state`
  (two letters, `NY`).
- `deal`: `rent` or `buy`.
- `cities`, `neighborhoods`, `must`, `nice`, `never`: lists, comma separated, on one line.
- Money is a plain number in the country's money (shekels or dollars), no sign and no
  commas. Rent is a month. A purchase price is the full price.
- Israel: `rooms_min` and `rooms_max` count rooms the Israeli way (the living room is a
  room). `size_min` is square meters.
- US: `beds_min`, `beds_max` and `baths_min` instead of rooms (a studio is `0` beds).
  `size_min` is square feet.
- `broker`: `ok` (a fee is fine), `avoid` (prefer without, a great place may have one) or
  `never`.
- `anchor_<name>`: a place the person's days go to: `Label | lat, lng`. Look the place up
  and write at least four decimals. The map shows each one and measures each find against it.
- Buyers add what applies: `equity` (cash for the deal), `mortgage_ok` (the monthly payment
  they can carry), `first_home` (`yes` or `no`), `new_build` (`yes`, `no` or `either`),
  `urban_renewal` (`yes` when a TAMA 38 or `פינוי בינוי` building is welcome). In the US
  also `down_payment`, `credit` (a rough score) and `loan` (`conventional`, `fha`, `va`).

Under the frontmatter: `## What matters most`, `## What would make a place perfect`,
`## What we learned from what they passed on` (the Scout keeps this one up to date).

### The feature words

Use these words in `must`, `nice`, `never`, and in a listing's `has`, `lacks`, `unknown`.
The map knows their names in English and Hebrew.

| Word | Means |
|---|---|
| `mamad` | Israel: a safe room in the apartment (ממ"ד) |
| `shelter` | Israel: a shared shelter in the building or a few steps away (מקלט / ממ"ק) |
| `elevator` | An elevator |
| `parking` | A parking space of its own |
| `balcony` | A balcony |
| `sun_balcony` | A sun balcony (מרפסת שמש), open to the sky |
| `garden` | A private garden |
| `roof` | A roof terrace |
| `aircon` | Air conditioning |
| `furnished` | Comes furnished |
| `pets` | Pets allowed |
| `renovated` | Renovated recently |
| `storage` | A storage room (מחסן) |
| `accessible` | Step-free from the street |
| `quiet` | A quiet street or a back-facing apartment |
| `bright` | Good light (high floor, open view, two or three directions) |
| `no_broker` | No broker fee |
| `long_lease` | The owner offers two years or more |
| `immediate` | Can move in now |
| `ground_floor` | On the ground floor (usually in `never`) |
| `no_window_bedroom` | A bedroom without a window |
| `laundry` | A washer and dryer in the apartment or the building |
| `in_unit_laundry` | A washer and dryer in the apartment |
| `dishwasher` | A dishwasher |
| `doorman` | A door attendant |
| `gym` | A gym in the building |
| `pool` | A pool |
| `outdoor_space` | A balcony, terrace, patio or yard of its own |
| `utilities_included` | Some or all utilities in the rent |
| `rent_stabilized` | New York: a rent-stabilised apartment |
| `basement_unit` | Partly below the street (usually in `never`) |

A word not in the list is shown as written. Prefer a list word when one fits.

## A listing: `listings/<name>.md`

One file per apartment, named `<source>-<the site's own id>.md` in lower case, for
example `yad2-a1b2c3.md` or `streeteasy-4581234.md`. The same apartment on two sites is one file (see `method.md`).

```
---
title: 3 rooms with a safe room on Shenkin
country: il
deal: rent
price: 7200
rooms: 3
size: 72
floor: 3
floors: 4
address: Shenkin 20, Tel Aviv
neighborhood: Lev HaIr
city: Tel Aviv
lat: 32.0700
lng: 34.7745
has: mamad, elevator, balcony, aircon
lacks: parking
unknown: pets
entry: 2027-01-01
broker: no
score: 86
verdict: top
opportunity: below_market
fair_price: 7700
fair_basis: Madlan, 3 rooms in Lev HaIr, median 7,700. 6 similar live ads, 7,100 to 8,400.
why: A safe room and an elevator under your budget, a 9 minute bike ride to Azrieli.
source: Yad2
url: https://www.yad2.co.il/realestate/item/a1b2c3
also_on: Madlan
posted: 2026-11-23
found: 2026-11-23T08:12
status: new
photo: https://...
---
## Why it fits
- ...

## Watch out
- ...

## Ask before you visit
- ...
```

- `country`: `il` or `us`, the same as the brief.
- `price`, `size`, `floor`, `floors`, `fair_price` are plain numbers. `size` is square
  meters in Israel and square feet in the US. For `deal: buy`, `price` is the full asking
  price. For a US rent with a concession, `price` is the gross lease rent; say the net
  effective rent in "Watch out".
- Israel uses `rooms`. The US uses `bedrooms` and `bathrooms` (`0` bedrooms is a studio,
  `1.5` bathrooms has a half bath), and no `rooms`.
- `verdict`: `top` (score 80 or more, go see it), `good` (65 to 79), `maybe` (50 to 64,
  worth a look if the market is thin). Below 50 gets no file.
- `opportunity` (optional): `below_market`, `fresh`, `price_cut`, `no_broker`,
  `rare_match`. Only when it is true and you can say why.
- `broker`: `yes`, `no` or `unknown`.
- `status`: `new` when written. Set `gone` when the ad was taken down or the apartment let.
  Never delete a listing file the person acted on.
- `url`: the ad itself, never a search page. `photo`: the ad's own first photo address,
  only if it starts with `https://`.
- `posted`: when the ad went up or was last bumped, if the site shows it.
- Write the words (title, why, the body) in the person's language.

## What the person did: `hunt/.data/shared.json`

The map keeps the person's actions under keys `l:<listing file name without .md>`:

```
{ "l:yad2-a1b2c3": { "status": "rejected", "reason": "noisy", "note": "Right above a bar", "at": "2026-11-23T19:02:11Z" } }
```

- `status`: `saved` or `rejected`.
- `reason` (on `rejected`): `price`, `area`, `small`, `noisy`, `dark`, `condition`,
  `missing`, `looks_off`, `other`. `note` is free text.

Read it before every search. Never write to it. Never write a new file for an apartment
the person rejected, and never show it again, even if it is listed again on another site.

## A search's record: `search/runs.json`

```
{
  "runs": [
    {
      "at": "2026-11-23T08:20:00+02:00",
      "kind": "search",
      "looked": 64,
      "kept": 4,
      "new": 3,
      "dropped": { "over budget": 21, "no safe room": 14, "outside the areas": 9, "seen before": 12, "rejected before": 1 },
      "sites": [
        { "name": "Yad2", "ok": true, "note": "41 ads in the filters" },
        { "name": "Madlan", "ok": false, "note": "The site asked for a check I cannot do" }
      ],
      "summary": "Three new places. The best is 3 rooms on Shenkin at 7,200 with a safe room."
    }
  ]
}
```

Newest first. Keep the last 30. `kind` is `search` or `market`. Read the file, add the new
run at the top, and write it back as valid JSON. The file does not exist before the first
run: create it then. `summary` is in the person's language.
