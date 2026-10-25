# The mayor's desk — 24 October 2026

A one-click "mayor's desk" for Nakhon Si Thammarat: the morning espresso —
the situation, the parts that make it, the day's news in plain Thai, and the
notice in force — **in one screen**.

*(The page height is a function of how much the compartments carry: the
answer and the whole first row are always in the first screen; the page
itself measured 1173 px at 1440 × 900 with live data on 26 October and
scrolls. §2 carries the corrected numbers.)*

The house system is the Chiang Mai operations war room's
(`cnx.nonarkara.org`, `/Volumes/Data/Projects/CNX`): the answer names the
worst signal, every part keeps its own provenance and age, a part that could
not be read says so with its reason, and "below threshold" is never painted
green. The severity ramp is that project's, measured on *this* product's
grounds. The geometry, the data and the audience are NST's.

Everything below was measured. Where a number is quoted, it came from a
render, a live payload or a live endpoint — not from reading the source.

---

## 1. What the desk is, and what it is not

It is **not** the flood briefing. `/flood-ops` is the full evidence: tables
of every station, camera comparison, and the copy-paste record for the file.
That surface answers "show me the evidence" and is as long as the evidence
is. The desk answers "what is the situation and what do I need to know this
morning", and **the first screen carries the answer and the whole first
row** — the page itself scrolls when the compartments are full.

The two overlap on the flood signals, and that overlap is deliberate: the
desk's flood numbers are the *same* synthesis the briefing reads
(`/api/flood/operations`), so the two can never disagree. The desk adds three
things the briefing has no room for: a one-line answer, the day's news, and
the translation.

Route: **https://nst.nonarkara.org/mayor-desk**. Entry point: the `DESK`
button in the header (desktop, ≥1101 px) and **Mayor's desk / โต๊ะทำงานนายกฯ**
in the More menu (≤1100 px, where the header collapses). One click either way.

---

## 2. The bento, measured at 1440 × 900

The law's target: *a bento box, not a long buffet. Every compartment holds
real content, never padding; compartments differ in size because their
contents differ; the whole fits one screen because the reader has to carry
it.*

The geometry is explicit, not auto-placed — a bento only looks like a bento
when the compartments are chosen:

```
row A   the answer ...........................................  12
row B   rivers (5)  |  official (3)  |  news (4, two rows)
row C   rain (5)    |  official (cont) |  news (cont)
```

Measured on the rendered page at 1440 × 900 (device scale 2, Chrome):

| | |
|---|---|
| horizontal overflow | **0 px** |
| compartment overlap | **0** |
| clipped compartments | **0** |
| content height | **1173 px** in a 900 px viewport — **the page scrolls** (re-measured 26 Oct, live data — see the correction below) |
| answer in the first screen | **yes** |
| smallest type on the surface | **13.0 px** (the 13 px floor) |
| cells | rivers 580×213 · official 343×559 · rain 580×404 · news 461×859 |

At **1024** (two columns) the page is **1425 px** and at **390** (one column)
**2439 px**: both scroll, both with **0 overflow, 0 overlap, 0 clipping**, and
both carry the answer inside the first screen. The one-screen promise is
made at desktop width, where the mayor reads it.

#### Correction, 26 October — the page height is data-dependent

This section originally claimed the page "fits one screen" at **839 px** in a
900 px viewport. That number was real, and it was measured on the *ordinary
data* moment of 24 October. It was then left standing as a general claim,
which it is not, and the law does not permit: the desk's height is a
function of how much content the compartments are carrying.

Re-measured at 1440 × 900 against **live data on 26 October**:

| | 24 Oct (ordinary data) | 26 Oct (live data) |
|---|---|---|
| page height | 839 px | **1173 px** |
| official cell | 343×541 (183 px of it an empty box) | **343×559** (13 px of padding, **no empty box**) |
| news cell | 461×541 (193 px empty) | **461×859** (13 px of padding, **no empty box**) |
| rivers / rain cells | 580×213 · 580×316 | 580×213 · 580×404 |

**The honest statement is: the desk's first screen carries the answer and
the whole first row; the page itself is 1173 px and scrolls.** What changed
between the two measurements is not a regression — it is the compartments
filling up. The 839 px figure came from a layout where the official and news
cells were **183 px and 193 px of empty bordered box** (the empty-box defect
repaired by `align-items: start` in `494ac45`). With the voids removed, the
room went back into content: the official cell now carries **six** DWR
stations closest to their own alert level (was three) and the news cell
**eight** headlines (was five). The page is taller because it says more, not
because it pads.

Every cell in every state now measures an **empty box of 13 px** — padding
only, at 1440, 1024 and 390.

### The voids, and what filled them

The first render had two compartments with dead space: the official column
was 541 px tall with 361 px of content, and the news had 63 px. An empty
box is spatial hallucination — a region with no task.

Both were filled with **content that was already measured and thrown away**:

- **The rivers cell** now carries the three closest gauges with their
  distance to the bank and their trend. The claim was "the closest gauge is
  0.54 m below the bank"; the reader now sees which three stations produced
  that and where the others sit.
- **The official cell** now carries the **six** DWR stations closest to their
  *own* alert level (raised from three when the empty-box repair freed the
  room), and the text of the last official notice rather than
  only its title. The **current** stations lead the list; the silent ones
  follow, marked `ล้าสมัย` — a station 27 days quiet may be the closest to
  the threshold, but it must never be the reader's first line of evidence
  (`8fa2c06`).
- **The news cells** lost the source name from the headline. The feed appends
  `" - www.topnews.co.th"`; the source is already printed on the line below,
  so the headline was wrapping a line to say the same thing twice. Stripping
  it is what let the headline fit, and it is pinned by a test. The cell now
  carries **eight** headlines (raised from five when the empty-box repair
  freed the room), still ranked most important first.

Nothing was added that has no task: no filler card, no badge row, no slogan.

### The empty-box repair, 25 October

Filling the voids with content was the first half of the fix. The second was
the cause: the official and news compartments span two grid rows, so each
inherited the rows' *combined* height — and when their data was short, each
became **an empty bordered panel, 183 px and 193 px at 1440 px**, with the
cell it landed in changing with the feed state. `align-items: start` on
`.desk-bento` makes every compartment exactly its content. Measured after:
**empty box 13 px — padding only — in every cell, in every state, at 1440,
1024 and 390.**

---

## 3. The translation, and the measurement that chose it

> *including news/reports in other languages translated for him into
> easy-to-understand headlines*

Three paths were measured, not assumed.

### The model path: quota exhausted, and shared

The owner's Gemini key is on the free tier's **20 requests per day** limit,
and it is shared by five products on this host (chonburi, kmitl, sikhio,
yala, and the local NST API). The first build used it, and the live desk
returned:

```
translationIncomplete: true
Floods persist in 16 provinces, two districts of Bangkok   ← left in English
```

The upstream response was explicit:

```
429 RESOURCE_EXHAUSTED — Generate requests per day limit exceeded on Free
Tier. quotaValue: "20" ... Please retry in 12h4m40s.
```

A desk that wanted one translation call an hour would exhaust that quota
**by itself**. So the model cannot be the primary path, and a desk that
shows "not translated" for most of the day fails the thing it was asked for.

The key is now configured on the Worker anyway (`wrangler secret put
GEMINI_API_KEY`) — it was missing entirely, so the chat and news-summarisation
features the Worker's own health check advertises were dead in production.

### The local-model path: the wrong host

Ollama is on this host with `qwen3:4b`, `gemma3:4b` and `qwen3-nothink`.
It was tried. The first request to `gemma3:4b` failed with `fetch failed`
while the host sat at **swap 7.0/8.0 GB used and 34 % free memory** — and
this host already serves the production flood data (the FloodDash relay
runs here), so loading a 2.5–3.3 GB model risks exactly the memory
exhaustion that has taken the tunnels down before. **A local model was
rejected on operational risk, not on quality.**

### The key-free path: what shipped

The translation uses the public, key-free translate endpoint. Measured on
the live headlines:

| source | on the desk |
|---|---|
| Floods persist in 16 provinces, two districts of Bangkok | น้ำท่วมต่อเนื่อง 16 จังหวัด 2 เขต กทม |
| Southern provinces warned of heavy to very heavy rain | จังหวัดภาคใต้เตือนฝนตกหนักถึงหนักมาก |
| PM urges southern provinces to prepare for floodwaters in 3-4 days | นายกฯ วอนจังหวัดภาคใต้เตรียมรับน้ำท่วมใน 3-4 วัน |
| Nakhon Si Thammarat flood: water level rises at Pak Phanang | น้ำท่วมนครศรีธรรมราช ระดับน้ำขึ้นที่ปากพนัง ยังคงมีฝนตกหนักต่อเนื่อง |

It needs no key, has no quota, works from a Worker, and its output is
headline-shaped Thai — which is what the desk asked for.

Three guards, each tested:

- a reply with **no Thai in it** is a failure, not a translation;
- a reply that grew into a **paragraph** (over 2× the source, or over 80
  characters) is refused — the desk wants a headline;
- a **failed or malformed** reply leaves the original headline in place and
  says so. A missing translation is never a missing story.

Each headline is translated once and cached by its text, not once per desk
refresh.

---

## 4. Most important first, and the ranking bug behind it

The first render put a **royal cremation ceremony** above a **flood warning
in 16 provinces**. That was wrong, and the cause was a double count: the
feed's own score already mixes trust with locality (+8 per locality
keyword), and the desk added locality *again* on top (+20 for a named
place, +12 for the province). A story that merely mentioned Pak Phanang
scored twice for the same reason.

Fixed: the feed score is now a small tie-breaker only (≤6), and the
weights are recency → what the story is about → locality:

| signal | weight |
|---|---|
| published within 3 h | 40 |
| within 8 h | 30 |
| within 24 h | 16 |
| within 48 h | 6 |
| flood / emergency / security / public-service tag | 30 / 24 / 18 / 12 |
| a named place in the city | 18 |
| the province | 8 |
| the feed's own score | ≤6 |

After the fix the live ranking leads with the flood story, translated, with
the ceremony fourth. Stories older than 36 hours are not in a *morning*
espresso at all.

Each story carries **why it is on the desk** — เรื่องน้ำท่วม, พาด <place>,
เรื่องจังหวัดนครศรีธรรมราช — so a reader can see the reason rather than
infer it.

---

## 5. The severity ramp, measured on this product's grounds

The ramp is a closed system, borrowed whole from the war room: **good**,
**watch**, **alert**, **critical**, **unknown**. It is not borrowed from a
decorative palette, because a recoloured warning is a lie.

The values were re-measured against NST's own surfaces rather than copied
from the sibling's, and written into `apps/web/src/styles/tokens.css` so
the token file stays the single source of truth:

| level | dark | on `--panel #151515` | light | on `--panel #ffffff` |
|---|---|---|---|---|
| good | `#4ade80` | 10.48:1 | `#15803d` | 5.02:1 |
| watch | `#facc15` | 11.92:1 | `#7f6300` | 5.70:1 |
| alert | `#fb7f4b` | 7.16:1 | `#b53c0a` | 5.81:1 |
| critical | `#ff6b6b` | 6.58:1 | `#b91c1c` | 6.47:1 |
| unknown | `#a6a6a6` | 7.50:1 | `#636363` | 6.01:1 |

Every value clears 4.5:1 in both themes. On the rendered desk: **0 text
elements under 4.5:1**, light and dark, across every paragraph, list item,
link and chip.

**Good and unknown are neutral outlines, never green.** A green chip reads
as an all-clear, and nothing on a flood desk can certify one. The e2e suite
asserts the background of the "no signal" chip is transparent.

Hue separation: watch 48° → alert 18° → critical 0°, a 30° gap then 18° —
the same spacing as the war room's own ramp. Colour is never the only
carrier: every level also prints its word (เฝ้าระวัง / เตือน / วิกฤติ /
ไม่ครบ), which is what keeps the 18° gap legible.

---

## 6. The parts, and what each one refuses to say

Each part keeps its own provenance and age, and none of them merges into a
single "flood" number, because a gauge and a model do not answer the same
question. Each line also carries its **kind** — วัดจริง / ประกาศ / แบบจำลอง.

- **ระดับน้ำที่สถานีวัด** (measured) — the closest gauge, its distance to
  the bank, its trend, and how many of the current gauges carry a bank datum.
  At or over the bank is *critical*; inside 30 cm is the near-bank *alert*;
  inside 60 cm is a *watch*.
- **ประกาศเตือน อต.** (official) — the authority's own tier if one is in
  force, otherwise how close the water is to DWR's own per-station alert
  level, and how many of those stations reported inside two hours.
- **ฝนที่วัดได้ 24 ชม.** (measured) and **พยากรณ์ฝน 24 ชม.** (model) — two
  lines, two kinds, one compartment: the same question ("how much water is
  coming") asked once of a measurement and once of a model.
- **ประกาศล่าสุดที่อ้างอิง** — the last TMD bulletin we hold, with its
  issue time, its recheck time, the text it said, and the emergency numbers.
  It is flagged as history the moment its recheck time passes.

The refusals are the point:

| state | what the desk says |
|---|---|
| no gauge data | "ไม่มีข้อมูลสถานีระดับน้ำ — ไม่ใช่หลักฐานว่าแม่น้ำปกติ" |
| no reading in 2 h | "สภาพน้ำปัจจุบันยังไม่ทราบ" |
| a gauge with no bank datum | counted as ungraded — never as safe |
| DWR unreadable | "ยังยืนยันสถานะเตือน อต. ไม่ได้ — แหล่งข้อมูลไม่ตอบ (ไม่ใช่การไม่มีประกาศ)" |
| no rain reading | "ไม่ใช่หลักฐานว่าฝนไม่ตก" |
| the model is stale | "อย่าใช้ตัวเลขเดิมเป็นพยากรณ์ปัจจุบัน" |
| nothing signalling, nothing missing | "ไม่พบสัญญาณน้ำท่วมจากทุกแหล่งขณะนี้ — ไม่ใช่การรับประกันความปลอดภัย" |

And the answer itself: if any part is missing, the answer is
**"ยังตอบไม่ครบ"** — an incomplete answer, never an all-clear by omission.

A stale DWR station is kept in the table and marked, but a *current* station
always leads the comparison: a 25-day-old reading must not head a table
that answers "how close is the water to the threshold now".

---

## 7. What is deferred, and why

- **Soil moisture on the desk.** The DWR stations carry measured soil
  moisture, and 4 NST stations are above 90 %. It is deliberately *not* on
  the desk: the only action the product has for it is a "ดินอิ่มตัว"
  insight on the map lens, and a number with no threshold and no action
  becomes a false-alarm generator on a page the mayor reads in the morning.
  It earns a compartment when it earns a task.
- **A live TMD bulletin fetch.** The notice on the desk is a dated
  constant, honestly flagged as history once its recheck time passes, with a
  link to the live TMD page. Scraping TMD under flood pressure is a new
  upstream integration with its own failure modes; the honest constant and
  the live link are the safer pair. This is recorded, not hidden.
- **A model-written plain-Thai headline.** The key-free translator already
  produces headline-shaped Thai. A model rewrite would be better, but it
  would cost the shared quota and would make the output inconsistent between
  headlines. If the desk ever gets its own model key, that is the upgrade.

---

## 8. Evidence

- `apps/api/src/adapters/mayorDesk.ts` — the parts, the ranking, the
  translation, the answer.
- `apps/api/src/adapters/mayorDesk.test.ts` — 31 tests: every refusal, the
  ranking, the translation guards.
- `apps/web/src/components/MayorDesk.tsx` + `apps/web/src/styles/mayor-desk.css`
  — the bento.
- `apps/web/tests/e2e/mayorDesk.spec.ts` — 5 browser tests: the answer
  first, the unavailable part, the translated headline and the untranslated
  one, the neutral chip, the phone.
- `apps/web/src/lib/ewsOfficial.ts` + test — the DWR layer the desk and the
  briefing share.
- `var/mayor-desk-2026-10-24/measure.mjs` — the measurement harness;
  `desk-390.png`, `desk-1024.png`, `desk-1440.png`.

Gates: web **1148** tests (80 files), API **787** tests (60 files),
`tsc -b` clean for both, both builds succeed. The desk is its own lazy
chunk — 8.5 KB of JavaScript and 5.5 KB of CSS — so it adds nothing to the
map's load.
