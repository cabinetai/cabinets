// Written by the competitor-scout agent. Keep this a single valid assignment.
// This shipped version is the EXAMPLE dataset: the 2004 MP3-player market,
// watched from the iPod team's desk. The Make-it-yours prompt on the cabinet's
// front page replaces it with your real market (and removes _note).
window.__CI_DATA__ = {
  generatedAt: "2004-11-16T08:00:00Z",
  product: "iPod",
  scanDepth: "Everything (positioning, pricing, product, blog/changelog/docs, news & social)",
  _note: "This is the shipped example — a reconstruction of the 2004 MP3-player market so you can see the shape of the dashboard. Run the Make-it-yours prompt on the cabinet's front page and your first real scan replaces all of it.",
  productInfo: {
    name: "iPod",
    image: "./img/ipod.jpg",
    tagline: "1,000 songs in your pocket — now with photos.",
    summary: "Fourth-generation iPod (click wheel) at $299/$399, iPod Photo new at $499/$599, iPod mini at $249, U2 Special Edition at $349. iTunes Music Store closing on its 200-millionth song; roughly nine of every ten hard-disk players sold in the US are iPods.",
    pricing: "iPod mini $249 · iPod 4G $299/$399 · iPod Photo $499/$599 · U2 $349",
    watchouts: "The $199 flank (Pocket DJ, flash players) and the day Sony ships native MP3."
  },
  competitors: [
    {
      slug: "creative-zen",
      image: "./img/creative-zen.jpg",
      name: "Creative Zen",
      homepage: "https://www.creative.com",
      color: "#E86A2B",
      category: "MP3-player line — Creative Technology",
      oneLiner: "The self-declared challenger: $100M pledged to \"the MP3 war\", with the Zen Micro as the spearhead.",
      positioning: "\"Zen Micro. So cute. So powerful.\" — more features than iPod mini for the same money, for the holiday shelf shopper.",
      pricing: {
        summary: "Zen Micro $249 · Zen Touch $269 · MuVo from $129",
        url: "https://www.creative.com",
        tiers: [
          { name: "Zen Micro", price: "$249.99", notes: "5GB, 10 colours, removable battery, FM — the iPod mini rival" },
          { name: "Zen Touch", price: "$269.99", notes: "20GB, 24-hour battery" },
          { name: "MuVo TX FM", price: "$129.99", notes: "256MB flash stick" }
        ]
      },
      keyProducts: ["Zen Micro (5GB microdrive, ships Nov 2004)", "Zen Touch (20GB, 24h battery)", "MuVo flash line", "PlaysForSure/WMA ecosystem"],
      funding: "$100M marketing war chest; claims #2 US HDD-player share",
      tracking: ["homepage","pricing","product","blog","changelog","docs","news","social"],
      social: { x: "", linkedin: "", other: "CNET / Engadget / Slashdot launch coverage running hot" },
      whyItMatters: "The only rival spending real money to make \"iPod vs Zen\" a story. The Zen Micro beats iPod mini on paper — battery, FM, price-per-GB — so every holiday shelf comparison is a fight.",
      current: { date: "2004-11-16", summary: "Declared a \"$100M MP3 war\" on the iPod at a Nov 16 press event; Zen Micro (5GB, 10 colours, $249) now shipping in US retail." },
      snapshots: [
        { date: "2004-11-16", summary: "War declared; Zen Micro ships.", reportPath: "competitors/creative-zen/EXAMPLE-2004-11-16.md" },
        { date: "2004-10-25", summary: "Baseline: Zen Touch $269, Zen Micro announced, MuVo leads unit share.", reportPath: "competitors/creative-zen/EXAMPLE-2004-10-25.md" }
      ],
      changes: [
        { date: "2004-11-16", type: "messaging", severity: "major", title: "Creative declares a \"$100M MP3 war\" on the iPod", detail: "Sim Wong Hoo, press event: \"Apple fired the first shot.\" Company-level repositioning from audio maker to declared challenger." },
        { date: "2004-11-16", type: "product", severity: "major", title: "Zen Micro ships in US retail", detail: "$249.99, 5GB, ten colours, removable battery, FM — aimed dollar-for-dollar at iPod mini." }
      ],
      recent: {
        releases: [ { date: "2004-11-16", title: "Zen Micro — US retail availability", url: "https://www.creative.com" } ],
        blog: [],
        news: [ { date: "2004-11-16", title: "Creative pledges US$100M to \"the MP3 war\"", source: "press event", url: "https://www.creative.com" } ]
      }
    },
    {
      slug: "sony-network-walkman",
      image: "./img/sony-network-walkman.jpg",
      name: "Sony Network Walkman",
      homepage: "https://www.sony.com",
      color: "#4A4A4A",
      category: "Hard-disk Walkman + Connect store",
      oneLiner: "The brand that owned portable audio for 25 years, betting the comeback on ATRAC — and paying for it.",
      positioning: "\"Walkman. Redefined.\" — the thinnest 20GB player with a 30-hour battery, for the mainstream buyer who still says \"Walkman\".",
      pricing: {
        summary: "NW-HD1 $399 (20GB)",
        url: "https://www.sony.com",
        tiers: [
          { name: "NW-HD1", price: "$399.99", notes: "20GB, 30h battery, ATRAC only — MP3 via transcode" }
        ]
      },
      keyProducts: ["NW-HD1 (20GB, smaller than iPod, 30h battery)", "SonicStage 2.x (required, disliked)", "Connect store (ATRAC-only, May 2004)"],
      funding: "The biggest CE brand on the shelf; Walkman relaunch under way",
      tracking: ["homepage","pricing","product","blog","changelog","docs","news","social"],
      social: { x: "", linkedin: "", other: "" },
      whyItMatters: "The one competitor whose brand alone moves units. Their hardware beats the iPod on size and battery; their ATRAC-only ecosystem is the self-inflicted wound keeping them beatable — watch the day they ship native MP3.",
      current: { date: "2004-11-16", summary: "NW-HD1 still ATRAC-handcuffed; NW-HD3 announcement expected in December with native MP3 as the headline rumour (unverified)." },
      snapshots: [
        { date: "2004-11-16", summary: "NW-HD3 / native-MP3 chatter firms up; otherwise unchanged.", reportPath: "competitors/sony-network-walkman/EXAMPLE-2004-11-16.md" },
        { date: "2004-10-25", summary: "Baseline: NW-HD1 $399, ATRAC-only, 30h battery is the one winning spec.", reportPath: "competitors/sony-network-walkman/EXAMPLE-2004-10-25.md" }
      ],
      changes: [
        { date: "2004-11-16", type: "news", severity: "minor", title: "NW-HD3 rumours firm up (December, native MP3)", detail: "Carried as watch, not verified — if it ships, the hardware comparison changes." }
      ],
      recent: {
        releases: [],
        blog: [],
        news: [ { date: "2004-11-10", title: "Sony expected to announce NW-HD3 in December", source: "trade press", url: "https://www.sony.com" } ]
      }
    },
    {
      slug: "rio",
      image: "./img/rio.jpg",
      name: "Rio",
      homepage: "https://www.rioaudio.com",
      color: "#2E6FD8",
      category: "Flash + microdrive players — D&M Holdings",
      oneLiner: "The oldest name in MP3 players; the Carbon is thinner and longer-lived than iPod mini at the same price.",
      positioning: "\"Rio Carbon. 5GB. Smaller. Lighter. Longer.\" — for the buyer who reads the reviews first.",
      pricing: {
        summary: "Carbon $249 · Karma $329 · Cali $139",
        url: "https://www.rioaudio.com",
        tiers: [
          { name: "Rio Carbon", price: "$249.99", notes: "5GB microdrive, ~20h battery, 84g" },
          { name: "Rio Karma", price: "$329.99", notes: "20GB, gapless, Ogg, ethernet dock" },
          { name: "Rio Cali", price: "$139.99", notes: "256MB flash, sport line" }
        ]
      },
      keyProducts: ["Rio Carbon (5GB, thinner than iPod mini)", "Rio Karma (the enthusiast's player: gapless, Ogg)", "Cali sport flash line"],
      funding: "Veteran brand under D&M Holdings; strong reviews, thin marketing",
      tracking: ["homepage","pricing","product","blog","changelog","docs","news","social"],
      social: { x: "", linkedin: "", other: "" },
      whyItMatters: "The review-circuit rival: the Carbon wins spec comparisons against iPod mini in print. No store, no halo, no ad budget — but a $199 Carbon over the holidays would bite.",
      current: { date: "2004-11-16", summary: "Quiet: Carbon keeps winning reviews it can't convert; no holiday campaign visible while Creative shouts." },
      snapshots: [
        { date: "2004-11-16", summary: "No material change; holiday campaign still absent.", reportPath: "competitors/rio/EXAMPLE-2004-11-16.md" },
        { date: "2004-10-25", summary: "Baseline: Carbon $249 drawing 'thinner than mini' reviews.", reportPath: "competitors/rio/EXAMPLE-2004-10-25.md" }
      ],
      changes: [
        { date: "2004-11-16", type: "social", severity: "info", title: "No material change", detail: "Holiday campaign still absent from major retail circulars — notable against Creative's $100M push." }
      ],
      recent: { releases: [], blog: [], news: [] }
    },
    {
      slug: "dell-dj",
      image: "./img/dell-dj.jpg",
      name: "Dell DJ",
      homepage: "https://www.dell.com",
      color: "#0076CE",
      category: "Dell Digital Jukebox — direct channel",
      oneLiner: "Not a better player — a cheaper one, moved through the world's biggest direct channel.",
      positioning: "\"More music. Less money.\" — same gigabytes, $50–$100 cheaper, straight from dell.com, for the buyer who shops on price.",
      pricing: {
        summary: "Pocket DJ $199 (5GB) · DJ 20 $249",
        url: "https://www.dell.com",
        tiers: [
          { name: "Pocket DJ", price: "$199.00", notes: "5GB — the iPod mini undercut" },
          { name: "DJ 15", price: "$199.00", notes: "15GB HDD" },
          { name: "DJ 20", price: "$249.00", notes: "20GB, ~16h battery, coupons stack" }
        ]
      },
      keyProducts: ["Pocket DJ (5GB, new this month)", "DJ 15/20 (Creative-derived HDD line)", "Rolling dell.com coupon codes", "Musicmatch + PlaysForSure bundle"],
      funding: "Whatever Dell decides — the channel is the strategy",
      tracking: ["homepage","pricing","product","blog","changelog","docs","news","social"],
      social: { x: "", linkedin: "", other: "" },
      whyItMatters: "The price floor of the market. Every silent coupon cut on dell.com resets what \"an MP3 player costs\" for pragmatic buyers and parents — the iPod mini's $249 looks expensive next to a $199 Pocket DJ.",
      current: { date: "2004-11-16", summary: "Pocket DJ live at $199 — undercutting iPod mini by $50 at identical 5GB; DJ 20 effectively ~$219 after coupons." },
      snapshots: [
        { date: "2004-11-16", summary: "Pocket DJ enters at $199; coupon stack deepens.", reportPath: "competitors/dell-dj/EXAMPLE-2004-11-16.md" },
        { date: "2004-10-25", summary: "Baseline: DJ 20 quietly cut to $249; Pocket DJ announced.", reportPath: "competitors/dell-dj/EXAMPLE-2004-10-25.md" }
      ],
      changes: [
        { date: "2004-11-16", type: "pricing", severity: "major", title: "Pocket DJ enters at $199 — $50 under iPod mini", detail: "Same 5GB capacity; Dell direct channel plus PC-order coupons." },
        { date: "2004-11-16", type: "pricing", severity: "minor", title: "DJ 20 coupon stack deepens", detail: "Effective price $249 → ~$219 with current code." }
      ],
      recent: {
        releases: [ { date: "2004-11-15", title: "Pocket DJ availability broadens on dell.com", url: "https://www.dell.com" } ],
        blog: [],
        news: []
      }
    },
    {
      slug: "iriver",
      image: "./img/iriver.jpg",
      name: "iRiver",
      homepage: "https://www.iriver.com",
      color: "#6FA45A",
      category: "Flash + HDD players — ReignCom, Korea",
      oneLiner: "The spec-sheet champion — colour screens, FM, recording, every codec — now carrying MSN Music's flag.",
      positioning: "\"iriver. Life on play.\" — the most capable players on the shelf, for the feature-driven buyer.",
      pricing: {
        summary: "H320 $329 · H140 $399 · iFP-899 $299",
        url: "https://www.iriver.com",
        tiers: [
          { name: "H320", price: "$329.99", notes: "20GB, colour screen, USB host" },
          { name: "H140", price: "$399.99", notes: "40GB, line-in recording" },
          { name: "iFP-899", price: "$299.99", notes: "1GB flash, 40h on one AA" }
        ]
      },
      keyProducts: ["H300 series (colour, FM, recording)", "iFP flash line (gym-crowd favourite)", "MSN Music launch-partner co-branding", "H10 (5GB colour microdrive) rumoured for early 2005"],
      funding: "#1–2 in Korea/Japan flash; growing US retail (Best Buy, CompUSA)",
      tracking: ["homepage","pricing","product","blog","changelog","docs","news","social"],
      social: { x: "", linkedin: "", other: "" },
      whyItMatters: "Wins every feature-comparison chart, and Microsoft just made them the face of MSN Music's launch. If PlaysForSure gets a real storefront moment, iRiver is who benefits first — and the H10 is aimed straight at iPod mini.",
      current: { date: "2004-11-16", summary: "Featured launch partner as MSN Music exits beta; H300 gets photo-viewer firmware; H10 (5GB, early 2005) leaks firm up." },
      snapshots: [
        { date: "2004-11-16", summary: "MSN Music launch halo; H300 firmware; H10 leaks.", reportPath: "competitors/iriver/EXAMPLE-2004-11-16.md" },
        { date: "2004-10-25", summary: "Baseline: spec-leader line-up, MSN partnership announced.", reportPath: "competitors/iriver/EXAMPLE-2004-10-25.md" }
      ],
      changes: [
        { date: "2004-11-16", type: "news", severity: "major", title: "MSN Music exits beta with iRiver as launch hardware partner", detail: "The PlaysForSure camp finally has a storefront to answer iTunes; iRiver hardware fronts the promos." },
        { date: "2004-11-16", type: "product", severity: "minor", title: "H300 November firmware: photo viewer + codec fixes", detail: "Keeps the colour-screen line ahead on paper — though iPod Photo just landed at the high end." }
      ],
      recent: {
        releases: [ { date: "2004-11-14", title: "H300 firmware — photo viewing", url: "https://www.iriver.com" } ],
        blog: [],
        news: [ { date: "2004-11-11", title: "MSN Music exits beta; iRiver launch partner", source: "Microsoft / press", url: "https://www.iriver.com" } ]
      }
    }
  ],
  feed: [
    { date: "2004-11-16", slug: "creative-zen", competitor: "Creative Zen", color: "#E86A2B", type: "messaging", severity: "major", title: "Creative declares a \"$100M MP3 war\" on the iPod", detail: "Sim Wong Hoo: \"Apple fired the first shot.\" A company-level repositioning, with the Zen Micro as the spearhead." },
    { date: "2004-11-16", slug: "creative-zen", competitor: "Creative Zen", color: "#E86A2B", type: "product", severity: "major", title: "Zen Micro ships in US retail", detail: "$249.99, 5GB, ten colours, removable battery, FM — dollar-for-dollar against iPod mini." },
    { date: "2004-11-16", slug: "iriver", competitor: "iRiver", color: "#6FA45A", type: "news", severity: "major", title: "MSN Music exits beta with iRiver as launch hardware partner", detail: "The PlaysForSure camp finally has a storefront to answer iTunes." },
    { date: "2004-11-16", slug: "dell-dj", competitor: "Dell DJ", color: "#0076CE", type: "pricing", severity: "major", title: "Pocket DJ enters at $199 — $50 under iPod mini", detail: "Identical 5GB capacity, Dell direct channel, coupons on top." },
    { date: "2004-11-16", slug: "sony-network-walkman", competitor: "Sony Network Walkman", color: "#4A4A4A", type: "news", severity: "minor", title: "NW-HD3 rumours firm up: December, native MP3", detail: "Carried as watch, not verified — the day Sony ships native MP3, the hardware comparison changes." },
    { date: "2004-11-16", slug: "iriver", competitor: "iRiver", color: "#6FA45A", type: "product", severity: "minor", title: "H300 November firmware: photo viewer", detail: "Answering iPod Photo on paper within three weeks." },
    { date: "2004-11-16", slug: "dell-dj", competitor: "Dell DJ", color: "#0076CE", type: "pricing", severity: "minor", title: "DJ 20 coupon stack deepens to ~$219 effective", detail: "Silent order-page change, no announcement — Dell's signature move." },
    { date: "2004-11-16", slug: "rio", competitor: "Rio", color: "#2E6FD8", type: "social", severity: "info", title: "Rio: no material change", detail: "Holiday campaign still absent while Creative shouts — noted." },
    { date: "2004-10-25", slug: "creative-zen", competitor: "Creative Zen", color: "#E86A2B", type: "baseline", severity: "info", title: "Baseline established — Creative Zen", detail: "Zen Touch $269, Zen Micro announced, MuVo leads unit share." },
    { date: "2004-10-25", slug: "sony-network-walkman", competitor: "Sony Network Walkman", color: "#4A4A4A", type: "baseline", severity: "info", title: "Baseline established — Sony Network Walkman", detail: "NW-HD1 $399, ATRAC-only; 30-hour battery is the one winning spec." },
    { date: "2004-10-25", slug: "rio", competitor: "Rio", color: "#2E6FD8", type: "baseline", severity: "info", title: "Baseline established — Rio", detail: "Carbon $249 drawing \"thinner than iPod mini\" reviews." },
    { date: "2004-10-25", slug: "dell-dj", competitor: "Dell DJ", color: "#0076CE", type: "baseline", severity: "info", title: "Baseline established — Dell DJ", detail: "DJ 20 quietly cut to $249; Pocket DJ announced at $199." },
    { date: "2004-10-25", slug: "iriver", competitor: "iRiver", color: "#6FA45A", type: "baseline", severity: "info", title: "Baseline established — iRiver", detail: "Spec-leader line-up; MSN Music partnership announced." }
  ]
};
