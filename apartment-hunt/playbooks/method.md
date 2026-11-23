---
title: The method
created: '2026-11-23T00:00:00Z'
modified: '2026-11-23T00:00:00Z'
tags: [playbooks, method, search]
---
# The method

How the Scout searches and judges. Follow it step by step on every search, by hand or on
the routine.

## 1. Read before you look

- `search/brief.md`: the person's areas, money, must list and deal breakers.
- `hunt/.data/shared.json`: every listing they saved or rejected, and why.
- `listings/`: every listing already on the map, so you never write one twice.
- The newest three runs in `search/runs.json`: what was blocked last time, what was thin.

If the rejections show a pattern (three or more for the same reason), tighten the search
for it now and say so in the summary.

## 2. The tools, in order

1. **Cabinet's browser**, when you have it (on the Cabinet desktop app). It is a real
   browser: Yad2, Madlan, Homeless, Zillow, StreetEasy, Trulia, HotPads and Apartments.com
   refuse plain requests, and the browser is the way to try them. The person may
   be watching, so move with purpose.
2. **Reading a page as text** (web fetch), for public pages that allow it: Komo, WinWin,
   agency sites, nadlan.gov.il pages that render without a browser, HUD's Fair Market
   Rents, city and county records, news.
3. **Web search**, to find ads that the sites' own search hides, and to check a street, a
   building or an agency. In Israel, search in Hebrew as well as English: `דירה להשכרה 3
   חדרים גבעתיים ממ"ד`. In the US: `2 bedroom no fee Prospect Heights laundry`.
4. **The shell**, for small things: `curl` to Nominatim to place an address, arithmetic.

When a site blocks you (a check, a captcha, an empty page twice), stop trying it for this
search, note it in the run, and move to the next. Never sign in. Never solve a captcha.

## 3. Where to look

Search every site that has ads in the person's areas. Use the brief's filters on the site
itself, so you read fewer and better ads.

### Israel

| Site | What it is good for | How |
|---|---|---|
| Yad2 (`yad2.co.il`) | The most ads, private owners and brokers | `/realestate/rent` or `/realestate/forsale`, with `city=<code>`, `rooms=3-4`, `price=5000-7500`. City codes: Tel Aviv 5000, Jerusalem 3000, Haifa 4000, Ramat Gan 8600, Givatayim 6300, Holon 6600, Bat Yam 6200, Herzliya 6400, Ra'anana 8700, Kfar Saba 6900, Petah Tikva 7900, Rishon LeZion 8300, Rehovot 8400, Netanya 7400, Modi'in 1200, Be'er Sheva 9000. If a filter in the address does not stick, set it on the page. Sort by newest. |
| Madlan (`madlan.co.il`) | Ads with area prices, and neighbourhood figures (median rent and price per meter, trends, schools) | `/for-rent/<city>-ישראל` or `/for-sale/<city>-ישראל`, for example `/for-rent/גבעתיים-ישראל`. The area pages are the best quick read of a fair price. |
| Homeless (`homeless.co.il`) | Older site, many private owners, often no broker | `/rent/` and `/sale/`, then the city. |
| Komo (`komo.co.il`) | Private ads, often cheaper, plain pages | Opens as text. |
| WinWin (`winwin.co.il`) | Ads from the Yedioth group | Real estate section, then the city. |
| Agency sites | Anglo-Saxon, RE/MAX, Century 21 Israel, local agencies | Useful for buying and for high-end rentals. Always a fee. |
| nadlan.gov.il | The government's record of real sales: price, size, floor, date, per street | The truth for buying. For renting, it is how you know what an owner paid, not what rent is fair. |
| Facebook groups | Many private rentals ("דירות להשכרה בתל אביב") | They need a sign-in. You never sign in. If the person pastes a post or a link from a group, judge it like any ad. |

### United States

| Site | What it is good for | How |
|---|---|---|
| Zillow (`zillow.com`) | The most ads in most of the country, rentals and sales, with a Rent Zestimate and the sold history of nearby homes | Search the city or neighbourhood, set the filters on the page, sort by newest. |
| StreetEasy (`streeteasy.com`) | New York City only, and the best there: price history of every apartment, no-fee and rent-stabilised filters | `/for-rent/<area>` or `/for-sale/<area>`, for example `/for-rent/prospect-heights`. The listing's price history shows cuts and past rents. |
| Redfin (`redfin.com`) | Sales first, rentals too; the Redfin Estimate and nearby sold homes | Best for buying and for checking a price. |
| Realtor.com | Sales from the agents' listing service (MLS), fresh and accurate | Buying. |
| Apartments.com, Zumper, HotPads, Trulia | Large and managed rental buildings | Rentals outside New York City especially. |
| Craigslist (`<city>.craigslist.org`, housing, apts) | Owners renting directly, sublets, rooms | Many scams: see 7. |
| Facebook Marketplace and groups | Owner rentals and sublets | They need a sign-in. You never sign in. Judge a pasted post like any ad. |
| Public records | County assessor and recorder sites, HUD Fair Market Rents, FEMA flood map, the city's building and violation records (New York City: HPD and DOB) | Fair price, the building's history, the flood risk. |

### Every search

Each search: newest ads first, back to your last run (or 14 days on a first search).

## 4. Read every ad

For each ad that passes the site's filters, open it and read all of it: the text, the
details table, the photos (what they show and what they avoid), the map pin, the date.

Collect: price, rooms, size, floor and floors in the building, the street and number if
shown, entry date, broker or not, and every feature word from `how-it-works.md` you can
confirm. A feature the ad does not mention is `unknown`, not missing. A feature the
photos or text rule out is in `lacks`.

**Same apartment, two sites.** The same street, floor, rooms and a price within 5 percent,
or the same photos, is one apartment. Keep one file, the cheapest honest ad (a private
owner over a broker at the same price), and name the others in `also_on`.

## 5. The gate

Drop the ad, and count why, if any of these is true:

- It breaks a deal breaker in `never`, or lacks a `must` word for certain. (`unknown` on a
  must passes the gate, and becomes the first question in "Ask before you visit".)
- The price is over `price_max` by more than 3 percent. Within 3 percent passes only with a
  reason: prices in Israel are often talked down a little, and you say so.
- Fewer rooms than `rooms_min` (Israel) or fewer bedrooms than `beds_min` or bathrooms
  than `baths_min` (US), or under `size_min` by more than 5 square meters or 50 square feet.
- Outside the areas, unless it is a close neighbour within the commute the person accepts.
  Then it may pass as `maybe`, and you say why.
- The entry date misses the move-in date by more than a month either way, unless the
  person said they are flexible.
- The person rejected this apartment before, on any site.
- It looks like a scam (see 7). Never show it as an option; mention it if the person might
  have seen it.

## 6. The score

Out of 100, for what passed the gate:

- **Fit, 40.** Each `must` confirmed is worth the most, each `nice` confirmed adds, each
  `unknown` must costs. Rooms and size above the minimum add a little.
- **Price, 25.** Against the fair price for this street and this kind of apartment. At the
  fair price, 15. Every 5 percent below adds 3, every 5 percent above takes 4. No broker fee
  adds 3 when `broker` is `avoid` or `never`.
- **Place, 20.** Distance to each anchor, by the way the person moves. The street itself:
  noise (a main road, bars, a bus terminal), light, a park or the sea, a school.
- **The ad, 15.** Fresh (under 48 hours) adds. Real photos of every room, a floor number,
  a full address and a clear entry date add. A stock photo, no interior photos, or "call for
  details" takes away.

Write a file only for 50 and above. Be strict: if you write more than eight files in one
search, raise your bar and keep the best.

### The fair price

Name your basis in `fair_basis`, always with how many you compared:

1. **Live ads like it**: same neighbourhood, the same rooms (or bedrooms), size within 15
   percent. Use the middle of them, not the lowest.
2. **Area figures.** Israel: Madlan's median rent or price per meter for the neighbourhood.
   US: Zillow's Rent Zestimate or Zestimate, the Redfin Estimate, and StreetEasy's past rents
   for the same apartment or building in New York City.
3. **For buying, real sales.** Israel: nadlan.gov.il, sales on the same street or the next
   ones since last year, per square meter. US: sold homes nearby since last year on Redfin
   or Zillow (public records), per square foot. Adjust for floor (higher is worth more with
   an elevator, less without one), condition, outdoor space, and a safe room in Israel.

Adjust for what moves price. In Israel: a safe room (more each year since 2023), an
elevator above the second floor, parking in the centre of a city, a balcony, renovation,
the floor, a building facing a main road. In the US: laundry in the apartment, a doorman
and an elevator, outdoor space, the walk to a subway or train, the school zone, a flood
zone, and for a rental, a concession that hides the real rent.

## 7. Smell test

Say it in "Watch out" when you see any of these:

- The price is more than 20 percent under the street. Real bargains exist, so check: no
  photos of the street, stolen photos (search an image description and the text), the
  owner "abroad", a deposit or `ביט` transfer asked before a viewing. Any request for money
  before a viewing is a scam. Drop it.
- "No broker" in the title and a broker's phone in the ad.
- Photos that skip a room, very wide-angle photos of a small space, only the view.
- "Garden apartment" on the ground floor of a busy street; "roof" that is a shared roof.
- "3 rooms" with a size under 55 meters: one of them is a small room.
- A building marked for TAMA 38 or `פינוי בינוי`: noise and dust for years, or for a buyer a
  future gain. Say which.
- A basement or semi-basement (`מרתף`, `קומת מרתף`, `קומה 1-`): damp, little light.
- An old ad bumped again and again: something keeps people away. Ask what.
- US: a rental copied from a for-sale listing (the same photos on Zillow or Redfin with
  another agent's name), a "landlord" who cannot show it and asks for Zelle, a wire, a gift
  card or an app payment before a viewing, or an application fee far over the state's cap.
- US: "net effective" rent shown as the price. Work out the gross rent and judge that.
- US: a "garden level" or "lower level" unit, a "flex" bedroom without a window, a building
  with open violations (New York City: HPD and DOB records), a flood zone on FEMA's map.

## 8. Ask before you visit

For each listing, three to six questions that would save a wasted trip, the most important
first. Always the unknown musts. Then from these, the ones that fit:

Everywhere:
- Is the apartment still free, and when exactly can I move in?
- Which floor, and is there an elevator?
- How long a lease will you sign, and is there an option to extend?
- Any damp, leaks or mould in winter? Any pests?
- Are pets fine, and is there a pet fee? Is there parking in the street at night?

Israel:
- How much is `ועד בית` and `ארנונה` a month?
- Is there a safe room in the apartment or a shelter in the building?
- Is there a broker's fee? Who pays it? (See the law in `israel.md`.)
- What guarantees do you ask for? (Cheques, a bank guarantee, guarantors. The law caps it.)
- When were the pipes and the electricity redone?
- For buying: is the apartment registered in `טאבו`, are there any liens, and is there a
  building permit for every room (an enclosed balcony often has none)?

United States:
- What is the total due at signing (first month, deposit, any fee)? Is there an application
  fee, and how much?
- What income and credit do you ask for? Do you take a guarantor or a guarantor company?
- Which utilities are in the rent? How is the apartment heated and cooled?
- Is the rent the gross rent, or net of a concession? What was the last renewal increase?
- New York City: is it rent stabilised? Any bed bugs in the last year (the disclosure form)?
- For buying: HOA or maintenance a month, any special assessment coming, the reserves, the
  property tax, and for a co-op, the board's rules on down payment and money after closing.

Write them as the person would ask them, in their language.

## 9. Write, then record

1. Write each listing file in the shape `how-it-works.md` gives, with its coordinates
   (from the ad's map pin, or the street and number through Nominatim).
2. When an ad you wrote before is gone, set its `status` to `gone`. When its price
   changed, update `price`, add a line in "Watch out" or "Why it fits" with the old price
   and the date, and set `opportunity: price_cut` if it fell.
3. Add the run to `search/runs.json`, with what you looked at, what you kept, what you
   dropped and why, and every site with whether it worked.

## 10. The answer

What the person reads first, in their language, three to five sentences: how many new
places, the best one with its price and the one reason it stands out, anything urgent (a
top pick posted an hour ago goes fast), and what blocked you, if anything did. If there is
nothing new: say so, and name the one change to the brief that would find more.
