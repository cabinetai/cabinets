// The Morning Brief as a printed page. Cabinet fills it after each morning run
// (the `pdf` step in .jobs/morning-report.yaml): `sys.inputs.source` is the
// report the run just wrote, and the fonts sit beside this file in fonts/.
// It reads the same shape the Report page reads: frontmatter, `## Section`
// bullets, `## Checked` last.

#let ink = rgb("#18202f")
#let ink-2 = rgb("#444b5a")
#let ink-3 = rgb("#636a78")
#let hair = rgb("#dcdad3")
#let red = rgb("#b3241c")
#let warn = rgb("#85560f")

#let news = ("Newsreader", "Frank Ruhl Libre")
#let small = ("Libre Franklin", "Frank Ruhl Libre")

// ---- Reading the report ----------------------------------------------------

#let lines = read(sys.inputs.source).split("\n").map(l => l.trim("\r", at: end))

#let unquote(v) = {
  let v = v.trim()
  if v.len() > 1 and v.first() == v.last() and (v.first() == "\"" or v.first() == "'") {
    v.slice(1, v.len() - 1)
  } else { v }
}

#let (front, body) = if lines.len() > 0 and lines.first().trim() == "---" {
  let end = lines.slice(1).position(l => l.trim() == "---")
  if end == none { ((:), lines) } else {
    let front = (:)
    for l in lines.slice(1, end + 1) {
      let m = l.match(regex("^([A-Za-z_]+):\s*(.*)$"))
      if m != none { front.insert(m.captures.at(0), unquote(m.captures.at(1))) }
    }
    (front, lines.slice(end + 2))
  }
} else { ((:), lines) }

#let sections = {
  let out = ()
  for l in body {
    if l.starts-with("## ") {
      out.push((name: l.slice(3).trim(), items: ()))
    } else if l.starts-with("- ") and out.len() > 0 {
      out.last().items.push(l.slice(2).trim())
    }
  }
  out
}
#let checked = sections.filter(s => lower(s.name) == "checked").map(s => s.items).flatten()
#let stories = sections.filter(s => lower(s.name) != "checked")

// "2026-08-13 07:00" -> the date and the time it was written.
#let stamp = {
  let m = front.at("generated", default: "").match(regex("^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}:\d{2}))?"))
  if m == none { (date: none, time: none) } else {
    let (y, mo, d, t) = m.captures
    (date: datetime(year: int(y), month: int(mo), day: int(d)), time: t)
  }
}

// Amounts print in bold, the way the page shows them, and a line that starts in
// Hebrew or Arabic runs from the right.
#let money(text) = {
  show regex("[$€£₪]\s?\d[\d,]*(?:\.\d+)?"): strong
  if text.match(regex("^[^\p{L}]*[\p{Hebrew}\p{Arabic}]")) != none {
    block(width: 100%, { set std.text(dir: rtl); set align(right); text })
  } else { text }
}

// ---- The page ----------------------------------------------------------------

#set document(title: "The Morning Brief")
#set page(paper: "us-letter", margin: (x: 0.7in, top: 0.6in, bottom: 0.7in),
  footer: context align(center, text(font: news, size: 8.5pt, style: "italic", fill: ink-3)[
    Read only, everywhere. This page never sends, replies or changes anything.
    #if counter(page).final().first() > 1 [ Page #counter(page).display() of #counter(page).final().first().]
  ]))
#set text(font: news, size: 10.5pt, fill: ink, lang: "en")
#set par(leading: 0.55em, spacing: 0.7em)
#set strong(delta: 200)

#let double = block(spacing: 0pt, {
  line(length: 100%, stroke: 1.6pt + ink)
  v(2pt)
  line(length: 100%, stroke: 0.6pt + ink)
})
#let label(body) = text(font: small, size: 8pt, weight: 500, fill: ink-2, body)

// Masthead
#align(center, text(font: "UnifrakturMaguntia", size: 44pt, fill: ink, bottom-edge: "descender")[The Morning Brief])
#v(6pt)
#double
#v(5pt)
#grid(columns: (1fr, auto, 1fr),
  label(if stamp.date != none { stamp.date.display("[weekday], [month repr:long] [day padding:none], [year]") }),
  label(if stamp.time != none [Written at #stamp.time]),
  align(right, label[#stories.len() #if stories.len() == 1 [source] else [sources]]),
)
#v(4pt)
#line(length: 100%, stroke: 0.6pt + ink)
#v(14pt)

// Headline
#if front.at("headline", default: "") != "" {
  block(width: 88%, {
    set text(size: 27pt, weight: "bold", tracking: -0.01em, hyphenate: false)
    set par(leading: 0.32em)
    money(front.headline)
  })
  v(10pt)
}

// First, this
#if front.at("verdict", default: "") != "" {
  line(length: 100%, stroke: 0.6pt + hair)
  v(6pt)
  grid(columns: (1.3in, 1fr), column-gutter: 14pt,
    text(size: 13pt, style: "italic", fill: red)[First, this],
    {
      if front.at("lead", default: "") != "" { label(front.lead); v(3pt) }
      text(size: 14pt, money(front.verdict))
    },
  )
  v(10pt)
}

// The sections, one column each and at most four to a row, with hairlines
// between the columns as on the page
#line(length: 100%, stroke: 0.6pt + ink)
#v(8pt)
#let time-row = regex("^(\d{1,2}:\d{2})(?:\s*(?:to|-|–)\s*(\d{1,2}:\d{2}))?,?\s+(.+)$")
#let story(s) = {
  line(length: 100%, stroke: 1pt + ink)
  v(3pt)
  grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
    text(size: 14pt, weight: "semibold", s.name),
    text(size: 8pt, style: "italic", fill: red)[#s.items.len() #if s.items.len() == 1 [item] else [items]],
  )
  v(1pt)
  line(length: 100%, stroke: 0.6pt + hair)
  for (i, item) in s.items.enumerate() {
    let m = item.match(time-row)
    block(above: 6pt, below: 6pt, if m != none {
      let (from, to, what) = m.captures
      text(font: small, size: 7.5pt, weight: 600, fill: ink-2)[#from#if to != none [–#to]]
      linebreak()
      money(what)
    } else { money(item) })
    if i < s.items.len() - 1 { line(length: 100%, stroke: 0.5pt + hair) }
  }
}
#let across = calc.max(1, calc.min(stories.len(), 4))
#set par(justify: false)
#grid(
  columns: (1fr,) * across,
  row-gutter: 16pt,
  inset: (x, y) => (left: if x == 0 { 0pt } else { 9pt }, right: if x == across - 1 { 0pt } else { 9pt }),
  stroke: (x, y) => (left: if x > 0 { 0.5pt + hair }),
  ..stories.map(story),
)
#v(10pt)

// What I looked at
#if checked.len() > 0 {
  v(6pt)
  double
  v(6pt)
  text(size: 13pt, style: "italic")[What I looked at]
  v(2pt)
  text(font: small, size: 8pt, weight: 500, checked.map(c => {
    let off = lower(c).contains("not ") or lower(c).contains("fail") or lower(c).contains("couldn")
    box(text(fill: if off { warn } else { ink-2 }, c))
  }).join(h(14pt)))
}
