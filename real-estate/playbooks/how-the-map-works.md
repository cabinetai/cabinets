---
title: How the map works
created: '2026-11-16T00:00:00Z'
modified: '2026-11-16T00:00:00Z'
tags: [playbooks, rules]
---
# How the map works

The rules every assistant follows, in one place. You rarely need to read this: tell an
assistant what changed and it keeps the map for you.

## A property lives in one of two places

1. **A file in `properties/`**, one `.md` per property. Assistants write these.
2. **The map's own store**, the file `map/.data/shared.json`. Everything the person
   adds or changes on the map lands there, under the key `a:<id>`.

For a property that has both, **the newer one shows**: the map compares the file's
last-changed time with the entry's `updatedAt`. The id of a file-backed property is
`f:` plus the file name without `.md`, so `properties/14-oak-street.md` pairs with the
key `a:f:14-oak-street`. A file with an `id:` line (see Writing) uses that id instead.

### Reading (assistants)

To know the true state of the portfolio, read both: every file in `properties/`, then
`map/.data/shared.json`. For each `a:` entry:

- `deleted: true` means the person removed that property on the map. Leave it out,
  unless its file changed after the entry's `updatedAt`: then the file shows again.
- An entry whose `updatedAt` is newer than its file replaces the file's values.
- An entry whose id does not start with `f:` is a property that exists only on the map.
- In `EXAMPLE-` files, dates move forward with `example_as_of`: the map adds the days
  since that date to every date, so the examples never go stale. Use the moved dates
  when you talk about an example.

### Writing (assistants)

Write a property as a file, in full. If the property has a newer entry in
`map/.data/shared.json`, start from that entry's values so nothing the person typed is
lost. To write a file for a property that exists only on the map (its id starts with
`p`), add `id: <that id>` to the top of the file, so the file and the map entry stay one
pin. Never edit `map/.data/shared.json` except in one case: when the person asks you
to remove a property for good, delete its file and its `a:` entry.

Skip `EXAMPLE-` files in every count and every answer once the person has a property
of their own. Never delete them yourself unless asked.

## The top of a property file

```
---
title: 14 Oak Street
address: 14 Oak Street, Austin, TX
lat: 30.2672
lng: -97.7431
type: House
status: Rented
value: 520000
rent: 2600
lease_end: 2027-06-30
---
```

- `lat` and `lng` put the pin on the map. Look the address up and write them as plain
  numbers with at least four decimals. Without them the property shows in the lists
  with a "Not on the map yet" note.
- `type` is one of: House, Apartment, Multi-family, Commercial, Land, Vacation home,
  Parking or storage, Other.
- `status` is one of: Rented, Vacant, Own use, Renovating, For sale, Sold.
- Money and sizes are plain numbers, no symbols and no commas. Dates are `YYYY-MM-DD`.
- `photo` is a link to a picture, starting with `https://`.

## The fields the map knows

Any other line on top becomes a field on the property. These names get the right label,
format and sums:

| About | Names |
|---|---|
| Money | `value`, `purchase_price`, `purchase_date`, `share`, `ownership`, `asking_price` |
| Loan | `mortgage_balance`, `mortgage_payment`, `mortgage_rate`, `rate_fixed_until`, `lender` |
| Rent | `rent`, `tenant`, `tenant_phone`, `tenant_email`, `lease_start`, `lease_end`, `deposit`, `rent_due_day`, `vacant_since` |
| Costs | `expenses`, `hoa`, `property_tax`, `tax_due`, `insurance`, `insurer`, `insurance_renewal` |
| The place | `size`, `lot_size`, `bedrooms`, `bathrooms`, `units`, `floor`, `year_built`, `parking`, `zoning`, `parcel_number` |
| Upkeep | `condition`, `next_inspection`, `last_renovated`, `renovation_budget`, `renovation_spent`, `renovation_ends` |
| People | `manager`, `manager_phone`, `handyman`, `agent` |
| Links | `documents`, `listing`, `photos` |

`rent`, `mortgage_payment`, `expenses` and `hoa` are a month. `property_tax` and
`insurance` are a year. A name that is not in the table shows as written, so
`gate_code: 4411` becomes a field called "Gate code".

The map watches these dates and warns 60 days ahead: `lease_end`, `tax_due`,
`insurance_renewal`, `rate_fixed_until`, `next_inspection`, `renovation_ends`.

## Under the top

Plain notes. A line like `- [ ] Call the roofer` is a to-do on the property, and
`- [x]` is a done one.
