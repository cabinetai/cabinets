---
title: Store Data
order: 9
---
# Store Data

Your shop's own numbers: what is in stock and what sold. The Promo Manager checks stock before every promotion (so we never promote what we cannot serve) and measures every campaign against real sales. The dashboard charts it.

> **The two CSV files here are fictional samples** so the cabinet works out of the box. Replace them with your real data using one of the options below, then delete the samples.

## Option A: connect your live data (recommended)
1. Find the folder where your point-of-sale or inventory system saves its exports. Most can export a daily CSV to Google Drive, Dropbox, OneDrive or iCloud.
2. In Cabinet, right-click this **store-data** folder and choose **Connect Knowledge**.
3. Pick that folder. It is mounted **view only**: agents can read it, and nothing in Cabinet can change it.
4. Make sure the exported files use the names and columns below. If your system uses different column names, add a short note at the bottom of this page mapping them (for example `qty = on_hand`), and the agents will follow it.

Connected folders are set up on each computer, not stored in the template. That is why this page ships instructions and samples instead of a ready-made connection.

## Option B: drop files in by hand
Export the two files from your system once a day and save them here, replacing the samples.

## Files and columns

### `inventory.csv`: what you have right now
| Column | Meaning | Example |
|---|---|---|
| `item` | Stock item id. Promotions refer to it (`dough_balls`). | `dough_balls` |
| `on_hand` | Units in stock now. | `260` |
| `par_level` | The level you normally stock to. | `300` |
| `unit` | Unit of measure. | `each`, `lb`, `qt` |
| `updated_at` | When the count was taken, ISO with offset. | `2026-10-05T08:00:00-04:00` |

### `sales-daily.csv`: what you sold each day
| Column | Meaning | Example |
|---|---|---|
| `date` | Business date. | `2026-10-04` |
| `slices_sold` | Slices sold that day. | `640` |
| `pies_sold` | Whole pies sold that day. | `92` |
| `revenue_usd` | Total revenue. | `4612.00` |
| `promo` | Promotion id running that day, or empty. | `win-slice` |
| `promo_redemptions` | How many times it was redeemed. | `196` |
| `game_id` | Game the promotion was for, or empty. | `nhl-2026020123` |

## Who uses what
| Agent | Uses | For |
|---|---|---|
| Promo Manager | `inventory.csv` | The stock check before firing: available = `on_hand` minus the promotion's `reserve`. |
| Results Analyst | `sales-daily.csv` | Results: redemptions against the cap, and the day against a normal day. |
| Shop Manager | `inventory.csv` | The Monday plan: stock the week will use and restock orders. |
| Dashboard | both | The Store pulse panel: 14 days of sales and stock against par. |

## Want more?
Other files you could add here later (agents will only use them once a skill is told about them): staffing schedule, delivery-app orders, reviews export.
