---
headline: 4 of 6 pages need you this morning
lead: Checkout
verdict: Nobody can pay while this page is down — it's the one thing to sort before anything else.
source: Chrome DevTools
generated: 2026-08-12 07:00
status: ok
---

## Fix first
- Open the checkout page yourself — it comes back as a server error, so no order can go through
- Replace the 4 MB photo on the gallery page — it's most of those six seconds

| Page | Status | Load | What's wrong | URL |
|---|---|---|---|---|
| Checkout | Broken | — | Server error, the page never loads | https://northwind-candles.example/checkout |
| Pricing | Errors | 2.1s | The Buy button's script is missing | https://northwind-candles.example/pricing |
| Photo gallery | Slow | 6.4s | The main photo is 4 MB | https://northwind-candles.example/gallery |
| Contact | Unclear | — | Asks for a sign-in, so not checked | https://northwind-candles.example/contact |
| Home page | OK | 1.2s | Nothing | https://northwind-candles.example/ |
| Blog | OK | 1.8s | Nothing | https://northwind-candles.example/blog |
