# Spatial hallucination audit — 22 October 2026

Scope: the NST control tower shell at 390 × 844, 1024 × 900 and 1440 × 900 — header band, phone brief sheet, tablet brief/layers sheets, desktop rails and the scroll boundaries between them. Law applied: `~/.design-laws/MSH.md` ("When you find SH, massacre"), together with `docs/VISUAL-INTEGRITY.md`, the shared municipal standard `/Users/axiom/Projects/_docs/DESIGN.md`, and `anti-slop-design`.

Geometry test: "Why is this here, why this size, and why this far from that?" The grid alone is not a reason.

Reviewed surfaces were rendered against the live production API (`nst-control-tower-api.drnon.workers.dev`), not a fixture. Evidence — before/after screenshots and measurement JSON — is in the local ignored artifact folder `var/spatial-hallucination-2026-10-22/` (`baseline-*`, `live-*`, `fix1-*`, `final-*`).

## Found, and what it cost

1. **The phone header carried a truncated identity and an empty box where the trust signal should have been.** At 390 px the city name was squeezed to "Nakhon Si T…" inside a 103 px box — a name that identifies nothing. Next to it, the feed-health control collapsed to a 44 × 44 bordered square holding an 8 px dot: its accessible text ("3 of 9 data sources not live") measured 0 × 0, so the one control that answers *can I trust these numbers?* was a blank box. 147 px of a 390 px header (38 %) bought no information.
2. **At 1024 px the identity box claimed 737 px of a 1024 px bar.** The free space went *inside* the identity element instead of between the identity and the controls, pushing the control cluster to the far right of a bar that was otherwise empty.
3. **The tablet brief sheet stretched every relationship across half the screen.** The sheet was a full-bleed opaque panel, so thirteen panels were each 1024 px wide. A two-figure stat pair ("Stations" / "Overbank") sat 504 px apart in 488 px tracks; a section's status ("WATER" → "◆ ELEVATED") sat 911 px from its own title; a reference gauge was 992 px wide holding two threshold marks; the prose ran the full 992 px. The right half of the tablet screen carried no content at all, and the map — the product's centre — was hidden behind the sheet.
4. **The desktop header was 73 px, not the 56 px it asked for.** There is no global `box-sizing: border-box` reset in this codebase, so `min-height: 56px` sized the *content* box: 56 + 8 + 8 padding + 1 border. Seventeen pixels of header bought nothing, and the map and rails started 17 px lower than the grid row intended.
5. **A hard scroll edge could slice a line of text in half.** At 1440 px a Thai headline and its source line were cut mid-glyph where the rail's two scroll regions meet; at 390 px the phone sheet cut "RISING / MAX FULL" at its bottom edge. Both read as rendering faults rather than as "there is more below".
6. **The landmark search inherited a phone's percentage sizing at tablet width** — 92 vw, a 942 px input box for one field.

## Changed

- **Header identity.** Three complete widths instead of one truncated one: the full municipality name on desktop, "Nakhon Si Thammarat" at tablet width, "NST-01" on the phone. The full name stays the link's accessible name at every width, and the Thai organisation line is untouched. The identity box no longer grows; the spacer takes the free space instead.
- **Header status.** The feed-health control keeps its word at narrow widths: the same worst-case state, in one word (`LIVE` / `STALE` / `DOWN` / `CHECK`) beside the status dot. The full sentence ("4 of 9 data sources not live") remains the accessible name and the desktop label, so the house rule that the wording is spoken from the worst case is not weakened.
- **Header box.** `box-sizing: border-box` on `.topbar`, 4 px vertical padding, and `line-height: 1.15` on the clock/weather values (the house type rule is 1.1 for data, 1.5 for prose). 73 px → 56 px.
- **Tablet composition.** Between 768 px and 1100 px the brief and layers sheets stop being full-bleed opaque panels and become a 460 px rail on the left, with the map filling the remaining 564 px. The tab structure is unchanged — BRIEF / MAP / LAYERS still switch the sheet — but the mayor now sees the brief and the city at the same time, and every panel gets a measure a person can read. The sheet's grab handle is removed (a rail is not a bottom sheet) and the landmark search is capped at the desktop width.
- **Scroll boundaries.** The desktop rail's scrolling region and the phone/tablet sheet each ended on a hard edge, and a line of text sliced in half by that edge reads as a rendering fault rather than as "there is more below". Each now carries an 18 px sticky overlay that dissolves the last line into the panel. The overlay is negatively margined, so it lifts away with the content when the reader reaches the end — nothing is permanently hidden.
  - *First attempt, withdrawn.* The first implementation was a CSS `mask-image` on the scroll container. That masked the container's own background as well as its content, so the sheet turned translucent at its bottom edge and the **map bled through** behind the rail — visible in both themes. The mask was replaced by the sticky overlay, which keeps the panel opaque. Found by inspecting the rendered pixels, not by reading the CSS.
- **Identity layer.** `TopBar.tsx` now imports `NST`, the canonical export, instead of the `CHONBURI` legacy alias — the only `CHONBURI` reference left in the web app. The alias itself stays in the shared package for the other consumers it exists for.

## The severity bars (22 October, second pass)

The owner pointed at the orange bar running down the left edge of the situation card in the tablet preview and called it spatial hallucination. It was.

The card carried `border-left: 4px solid var(--status)`. In the warning state that is a 4 × 221 px band of saturated orange (4 × 335 px when the card is at full length), and it failed the law's test three ways:

- **Why is it here?** To mark severity — which the card already states twice, 20 px away: a coloured status glyph and the word "WARNING". The rule's marginal job was zero.
- **Why this size?** 4 px wide and the card's *entire* height. The house pattern is 2 px (`/Users/axiom/Projects/_docs/DESIGN.md`: "Accent stripe pattern: 2px solid var(--accent) as a top or left edge indicator").
- **Why this far from that?** Flush with the card's edge, so it read as a frame around the whole panel — implying that the suggested action, the button and the "Gauges updated 1h ago" line were also the alert. And because it was the largest block of colour in the rail, it outranked the headline it annotated.

**The fix:** the rule now marks the line that states the status. It is 2 px, it is the height of the level line (~18 px), and it sits in the card's own left gutter so the level line's text keeps the same 16 px alignment as every other line in the rail. Removing the card's 4 px border also let the card's content align with the rest of the rail instead of sitting 4 px proud of it.

A sweep of every rendered element with a left border of 3 px or more found the same failure elsewhere: `.evac-row` — the "who to move first" village card — ran a 4 px gold rule down **356 px** at 1440 px, the longest coloured bar in the product, on a card whose first line already says "▲ WATCH · เฝ้าระวัง · flash flood" with a coloured glyph. It got the same treatment: a 2 px rule on the tier line, with the row's left padding taking back the 4 px so its text does not move.

After both fixes, at 390 / 1024 / 1440 px with every collapsed section opened, the only remaining left rules of 3 px or more are a 3 × 36 px active-state marker on a layer toggle — the sanctioned "2 px accent stripe … active panel, current lens, live status" pattern, bounded by its own row.

**A second defect fell out of the same sweep:** the hotline buttons overflowed the rail by 10 px (`.hotlines__call` sets `width: 100%`, and with no global `box-sizing` reset that resolved to the content box, so the button's own padding pushed it past the rail edge where `overflow-x: hidden` silently cut the line number off). This was a regression introduced by narrowing the rail to 460 px. `box-sizing: border-box` on that rule fixes it; rail overflow is now 0 at every width.

## Independent review

The law and `anti-slop-design` both require a second pair of eyes — "never self-review". An independent verifier agent reviewed this change against the claims above, without having written any of it, and drove the real interface at every width. Its verdict was **PASS WITH NOTES**: the spatial-hallucination repair itself held up, but it found six defects in the repair, two of them live WCAG 2.5.3 AA regressions. All six are now fixed and re-measured.

| # | Finding | Severity | Fix |
|---|---|---|---|
| D1 | The health control's visible word ("STALE") was absent from its accessible name — the button's `aria-label` carried only the long sentence. A speech-input user could not say "click STALE". It also broke this file's own stated contract at the top of `TopBar.tsx`. | HIGH (WCAG 2.5.3) | The label now opens with the short word: `STALE — 4 of 9 data sources not live. Open source details.` |
| D2 | The identity link's visible name at ≤760 px ("NST-01") was absent from its accessible name, because the new `aria-label` overrode the content-derived name. | HIGH (WCAG 2.5.3) | The label now leads with the short id: `NST-01 · Nakhon Si Thammarat City Municipality · …`. |
| D3 | Below 390 px the health button had no `flex: none`, so it shrank below its own word and painted "DOWN" outside its border, colliding with the More button. | MEDIUM | `flex: none` on `.topbar-health` at ≤1100 px. |
| D4 | The tablet fade sat 62 px **above** the real scroll edge: the rail's `padding-bottom: 62px` already removes 62 px from the sticky containing block, so the extra `bottom: 62px` double-counted. The line-slicing defect claim F set out to remove was therefore still present at 1024 px, and the fade dimmed a heading in the middle of the content. | MEDIUM-HIGH | The tablet offset is removed. The overlay now measures from the content box, which already ends at the visible edge — verified flush (820–836 against an edge at 837). |
| D5 | The overlay's negative margin meant it never lifted at the end of a scroll, dimming the last line ("SPEED TEST" was measurably greyed with the overlay on and bright with it off). | LOW | The negative margin is gone. The overlay now occupies its own 18 px at the end of the content and lifts away with it. |
| D6 | The three identity tiers are sibling spans inside one link, so the link's text content is all three concatenated. Harmless while the `aria-label` is present, but it would surface in any name-computed-from-contents path. | LOW | Recorded, not changed — the `aria-label` is authoritative and the tiers are `aria-hidden` where not visible. |

The verifier also corrected one of my own claims: **"the map keeps the majority of the screen" at tablet width oversells it.** The rail takes 44.9 % at 1024 px and 46.0 % at 768 px, so the map holds about half. The rail is still the right call, but the wording should not carry weight in review.

Re-measured after the fixes:

| | before fix | after fix |
|---|---|---|
| Identity at 320 / 360 / 375 px | clipped to "N…" (box 24–50 px vs 52 px of text) | **complete, box 52.3 px = text 52.3 px** |
| Health word escaping its button, 320 px | yes (41.7 px of word in a 28.6 px content box) | **no, at every width** |
| Health visible text in accessible name | no | **yes, at every width** |
| Identity visible text in accessible name | no | **yes, at every width** |
| Tablet fade band vs scroll edge | 62 px too high | **flush** |
| Last line under the fade, full scroll | dimmed | **lifted, fully legible** |
| Header overflow at 320–1440 px | 0 | **0** |

The verifier's remaining notes, all pre-existing and recorded rather than regressions: the desktop header still wraps to two rows at 1101–1211 px and 1281–1330 px (86 px after this change, 98 px before — improved but not removed, and the 34 px cliff at the 1100/1101 boundary survives); the More menu needs scrolling to reach its last item at short viewports (it is a scroll container and the item is reachable and hit-testable once scrolled); at 200 % text zoom on a 390 px phone the header overflows by 14 px; and with the tablet rail up, the Old Town label and the western third of the boundary outline sit behind the rail.

## Verified

Measured after the change, against live data:

| | before | after |
|---|---|---|
| Header height, 1440 px | 73 px | **56 px** |
| Header height, 390 / 1024 px | 53 px | **52 px** |
| Phone identity | "Nakhon Si T…" (103 px, clipped) | **"NST-01" (52 px, complete)** |
| Phone health control | 44 px box, 8 px dot, text 0 × 0 | **80 px, dot + state word** |
| Tablet identity box | 737 px of a 1024 px bar | **157 px**, free space moved to the spacer |
| Tablet stat pair | 504 px apart, 488 px tracks | **222 px apart, 206 px tracks** |
| Tablet section status | 911 px from its title | **within a 428 px panel** |
| Tablet gauge / prose measure | 992 px | **428 px (≈ 55 characters)** |
| Tablet sheet | full-bleed 1024 px, map hidden | **461 px rail, map visible 564 px** |
| Horizontal overflow, all widths | 0 | **0** |
| Page overflow, all widths | 0 | **0** |

Screenshots at 390 × 844, 1024 × 900 and 1440 × 900 are in `var/spatial-hallucination-2026-10-22/`. The phone brief, the tablet brief beside the map, and the desktop shell were all inspected as rendered images; every number above is read from the DOM at that width, not from the source.

The scroll-boundary overlay was checked in three states: mid-scroll (the last line dissolves into the panel), fully scrolled (the overlay has lifted and the final item is fully legible), and with the container's background sampled for opacity (opaque in both dark and light theme — the withdrawn mask did not).

Local release gates: **1138 web unit tests passed (78 files)**, `tsc -b` typecheck clean, production build succeeded.

## Remaining

- **The lens explainer is the largest prose block left.** At 1440 px it and the map-overlays note take 240 px — about 30 % of the right rail. It sits directly under the lens select, so it is earned context rather than invented space, and it was left in place. It is the first thing to look at in a later pass.
- **The tablet rail costs map framing, and it is worth a decision rather than a footnote.** With the brief rail open — the default tablet view — the Old Town label and roughly the western third of the municipality boundary outline sit behind the 460 px rail. The outline's centroid stays in the visible strip, so the framing is usable, but one line of MapLibre padding would centre the city in the visible area. The map camera was deliberately left alone here: the map has its own recent fixes and moving it is a map decision, not a layout one.
- **The desktop header still wraps to two rows** at 1101–1211 px and 1281–~1330 px (86 px after this change, 98 px before). The wrap is pre-existing; this change made it shorter but did not remove it, and the 34 px cliff at the 1100/1101 boundary survives. It is the next thing to take up at desktop widths.
- **At 200 % text zoom on a 390 px phone the header overflows by 14 px** and the identity collapses to zero width. Pre-existing and unchanged by this work, but the phone header is now denser, so it is closer to the edge than it was.
- **Upstream data was slow during the audit window.** The production API answers cold requests in 15–60 s; several captures caught the loading state, where panels show "—" and "Checking the water gauges…". Layout geometry is unaffected by that state, but the figures in those captures are placeholders, not readings.
- This is a bounded audit of the shell and the sheets named above, not a claim that every panel in the product is free of spatial hallucination.

---

# Second pass — the complete sweep (every surface)

The first pass was a bounded audit of the shell. The owner then asked for the whole product: *"Check everything: MSH completely — the site is still heavily spatially hallucinated."* This pass therefore swept **every surface the product exposes** and repaired what it found.

## The sweep

A harness (`var/spatial-hallucination-2026-10-22/sweep.mjs`, git-ignored) drives the real interface in Chrome and measures, at **390 × 844, 1024 × 900 and 1440 × 900**:

| surface | what was walked |
|---|---|
| `/` | all **9 lenses** (executive, operations, flood, traffic, air, earth, safety, vibes, intelligence), 2D/3D |
| `/` on a phone | all **3 tabs** — BRIEF, MAP, LAYERS |
| dialogs | source catalog, user manual, flood guide, whitepaper, atlas, Google Sheet, keyboard shortcuts, 3D heritage, CCTV command centre |
| routes | `/flood-ops`, `/data`, the Watch Terminal (More → Analyst data view) |

**72 surfaces** in total, each measured for: chrome cost (union of fixed/sticky bands), ink coverage of the first screen, **ink holes** (vertical bands of a scroll container with no content in them), stretch (a child that inherited a taller sibling's height), clipping (a box hiding the content it was given), occlusion (a control whose hit-test lands on something else), touch-target size, horizontal overflow and console errors.

The measurement passes were re-run after every repair, and the numbers below are read from the rendered DOM, not from the source.

## Found, and what it cost

1. **The map's overlay column stole the clicks of the landmark search** (desktop, ≥1101 px). `.map-overlay-controls` was a 360 px-wide transparent column at `z-index: 36`; the centred `.building-search` sat at `z-index: 35`. The overlay's chips occupy its first ~130 px, but the column's empty right half reached across the search field. Measured before: `document.elementFromPoint` at the search input's centre returned `.map-overlay-actions`, and a Playwright click on the input **timed out** — 165 px of a 324 px field could not be clicked, including its middle. The same transparent column also blocked map dragging in the map's top-left corner.
2. **At tablet width the rail scrolled under the fixed tab bar.** The tablet rail had `bottom: 0; padding-bottom: 62px`, so its scroll viewport ran to the bottom of the screen *under* the 62 px opaque tab bar. Bottom padding only clears the bar at the *end* of a scroll; mid-scroll, content passed behind it. Measured before: `button.sidebar-section__hdr` — a rail section header — hit-tested onto `button.mobile-nav-btn.active`. The header was visible and unclickable.
3. **Every camera name in the CCTV command centre was crushed to 18 % of its box.** `.cctv-cell` carried `aspect-ratio: 16/9` *and* a label row, so the name's grid column got **26 px of a 141 px tile**; 60–170 px of each Thai camera name was cut (`scrollWidth − clientWidth`). Twelve elements were clipped. In a wall whose whole job is to identify a camera, no tile could be named.
4. **400 px of unexplained black beside the open-data workbench's introduction** (1440 px). `.dwb-main` is a 1360 px container, but `.dwb-hero` and `.dwb-rule` were capped at 960 px and left-aligned inside it — so ~400 px of the screen stood empty beside both, while the stat grid immediately below already ran the full width. The page read as unfinished, not composed.
5. **The atlas charts drew `NaN` geometry.** `LineArea` fed unfiltered points into its scales; one non-numeric reading poisoned `min`/`max` and the browser logged `<polygon> attribute points: Expected number, "NaN,170 NaN,139.…"` and `<circle> attribute cx: Expected length, "NaN"`. The population-trend chart drew nothing.
6. **Two buttons had no place on the page at all.** The flash-flood and watershed-metro openers were rendered as children of the shell with no grid area, so the grid auto-placed them in an **implicit row under the page**. Measured at 1440 px: the shell's rows were `56px 765px 49px 30px` — a 4th row nobody asked for, below the bottom bar. At 390 px: two extra 29 px rows at y = 786 and y = 815, which is exactly where the fixed tab bar sits (781–844). Both buttons were unreachable, and the phone page grew 58 px for nothing.
7. **The desktop header grew 38 px during the sweep** — traced to the critical-system banner appearing because the upstream API reported `down`. Not a layout defect; recorded because it changes every chrome measurement taken in that state.

## Changed

- **The overlay column no longer intercepts what it does not paint.** `.map-overlay-controls` is `pointer-events: none` with its buttons `pointer-events: auto`, and `.map-overlay-actions` sizes to its chips (`width: fit-content`) instead of claiming the column's full width. The chips, the map drag and the search field each own their own pixels again.
- **The tablet rail ends at the tab bar.** `bottom: 62px`, `padding-bottom: 0` — the scroll viewport now stops where the tab bar begins, so nothing passes behind it. The tab bar is full-width and opaque, so nothing shows in the strip below the rail anyway. The sticky fade still measures flush from the content box.
- **The CCTV tile is the picture again, and the name rides on it.** The 16:9 ratio belongs to the video, not to a card that also carries a label. The camera's **name is a lower-third over the picture with the tile's full width**; the asset code and the state moved to a corner slug on the picture, and the frame time stacked under the LIVE badge. Nothing was removed from the tile and the density per screen did not change.
- **The open-data overview is two columns.** At ≥1200 px the hero (779 px) and the preparation rule (557 px) sit side by side — two halves of one thought — and the stats and tables span the full width. Below 1200 px it stacks exactly as before. The prose keeps its own 720 px measure.
- **The atlas charts filter before they scale.** Non-finite points are dropped, empty series are skipped, and an empty scale falls back to a safe range. The chart now draws what the data contains.
- **The two orphan buttons came home.** `FlashFloodAlert` and `MetroInfographic` now render in the left rail, in a `.rail-triggers` row with the rest of the situation content. Their modals are portalled to `document.body`: the phone rail is a translated sheet, and a `position: fixed` overlay inside a transformed ancestor is contained by it — the modal would have opened inside the sheet instead of over the screen. The shell's grid has no implicit row again (`56px 765px 49px`).

## Verified

| | before | after |
|---|---|---|
| Landmark search, 1440 px | click on the field **timed out**; hit-test → `.map-overlay-actions` | **click focuses the field**; hit-test → the input |
| Rail section header, 1024 px | hit-test → `button.mobile-nav-btn.active` | **hit-test → the header**; the rail still scrolls |
| CCTV camera name | 26 px of a 141 px tile; 60–170 px cut | **127 px — the tile's full width**; 18 of 24 names now fit whole, 6 still overrun (max 68 px) but each truncates with a visible ellipsis, and the tile's `title` and `aria-label` both carry the full name |
| CCTV tile height / wall height | 81 px tile in a 420 px wall | **81 px tile in the same 420 px wall** — the same rows fit |
| Open-data ink coverage, 1440 px | 0.261 (≈ 400 px of empty right) | **0.307, the void is gone** |
| Shell grid rows, 1440 px | `56px 765px 49px 30px` | **`56px 765px 49px`** |
| Shell grid rows, 390 px | `52px 734px 29px 29px` | **`52px 792px`**; document height 844 = viewport |
| Both orphan triggers, 390 px | under the tab bar, unclickable | **hit-test → the button** |
| Flash-flood modal, 390 px | — | **covers 390 × 844 at (0,0)** |
| Atlas charts | 6 `NaN` SVG console errors | **0** |
| Horizontal overflow, 72 surfaces | 0 | **0** |

Local release gates: **1138 web unit tests passed (78 files)**, `tsc -b` clean, production build succeeded.

**Two limits on what the table above proves.** The CCTV command centre is reachable only at **≥1101 px** — `.topbar-nav > .btn` is `display: none` below that — so every CCTV row is measured at 1440 px alone and is *not* evidence about tablet or phone. And the six names that still overrun are a deliberate truncation, not a repair I can claim: a 141 px tile at a 13 px type floor cannot hold `ปากซอยอิศวร(ถ.ศรีธรรมราช)ตัวที่ 1`, and the two ways to fix it — wrapping to a second line or shrinking the type — would each cost more picture or more size than the name is worth in a wall of 24.

One test, `terrainAndChediWiring.test.ts`, failed a 5 s timeout while three Chrome sweeps were running and passed alone in 3.4 s. The assertion is unchanged; the budget was widened because the cost is the module load, not the check. It was then measured cold at **1.8 s** and the budget settled at **10 s** — enough headroom for a loaded machine, and still tight enough to catch a genuine regression.

## Remaining — measured, and left in place on purpose

- **The bilingual whitepaper's Thai column carries 211–655 px of space** below its last section. It is a two-column pairing with a 2 px divider rule down the seam; the rule is the reason the column is as tall as it is, and the English column beside it carries text to the same depth. The space is the end of the shorter column, not an invented gap.
- **The atlas KPI and chart cards are equal-height** (56–129 px of slack in the chart row). `.atlas-kpi-src` pushes the source note to the card's foot with `margin-top: auto`, so the gap between the number and its source is consistent across the row by design.
- **The desktop right rail is two scroll regions** — news above (373 px holding 1683 px), the layer palette pinned below (423 px holding 1236 px). The palette's seven groups are collapsible and one starts collapsed, so the reader can shorten it; the two regions hold different kinds of content (a feed and a control surface) and are deliberately not one long scroll.
- **The flood-ops page's right column ends 658 px above the left column's end.** An unequal two-column document; the space is the end of the shorter column.
- **The upstream API is degraded during this window.** `/api/water/gauges` times out (60 s, 0 bytes) while `/api/health` reports `ok`, so the left rail's headline card renders its "NO DATA · Checking the water gauges…" state and the critical-system banner appears at times. Geometry measured in that state is valid; any figure that depends on live water readings is not.
- **Pre-existing and still open** (from the first pass, unchanged): the desktop header still wraps to two rows at 1101–1211 px and 1281–~1330 px; at 200 % text zoom on a 390 px phone the header overflows by 14 px; with the tablet rail up, the Old Town label and the western third of the boundary outline sit behind the rail.

# Independent review — the second pass

The law and `anti-slop-design` both require a second pair of eyes: *"never
self-review."* A second independent verifier agent reviewed the six sweep
repairs against the claims above, drove the real interface at every width,
and returned **six defects in the repair** — the same shape of finding as
the first pass. All six are now fixed and re-measured.

| # | what the verifier found | | the repair |
|---|---|---|---|
| V1 | **The atlas rainfall chart had emptied itself and drawn a fabricated 0–1 mm axis in its place.** Its x values are categorical (`Jan`…`Dec`); `Number("Jan")` is `NaN`, so every point was filtered out and the chart rendered an empty frame around a scale that lied about the numbers it replaced. | HIGH | The chart now detects a categorical x and positions by point **index** while keeping the original **label**. A series with no usable readings renders **"No data for this series"** instead of an axis. Verified: the rainfall chart draws 1 polygon + 1 polyline + **12 circles**, ticks 0/140/280, labels Jan…Nov; **0 `NaN`** across all 39 atlas charts. |
| V2 | **The CCTV camera's code and state had left the accessible name.** The corner slug carrying them was `aria-hidden`, so the tile announced a name and nothing else — no state, no asset code. | MEDIUM | The tile's `aria-label` now reads `{name} — {state} — {code} — open live view`. Measured: `"สี่แยกศาลากลางตัวที่ 1 — Online — TF001 — open live view"`. |
| V3 | **The CCTV corner slug had no scrim.** White 9 px text sat straight on the picture — measured **1.00:1** at the brightest pixel of the light-theme standby placeholder. | MEDIUM | The corner now carries its own `rgba(0,0,0,0.62)` plate → **21:1** in both themes. |
| V4 | **The CCTV lower-third's worst pixel over a bright video frame was 1.82–3.09:1.** | LOW | The scrim is now 90 % black under the text (72 % opaque, fading above), so the name survives any frame. |
| V5 | **The two rail triggers were 29 px tall** at 390 px — under the 44 px touch rule. | LOW | `min-height: 44px` under `@media (max-width: 1100px)`. Measured at 390 and 1024: both triggers are exactly **44 px** and hit-test to themselves. |
| V6 | **The rail's bottom edge and the tab bar's top edge still overlapped by 1 px** — the nav's 1 px top border sat outside its 62 px. | LOW | `box-sizing: border-box` on `.mobile-nav` (scoped; this codebase has no global border-box reset). Measured: rail bottom **838 = nav top 838** at 1024, **782 = 782** at 390; overlap **0**. |

# Third pass — the typeface that was never shipped

Reading the diff to correct the report turned up a defect that has nothing
to do with space and everything to do with what the product claims to be.

**The product ships two typefaces: Libre Franklin (self-hosted, `styles/fonts.css`)
and IBM Plex Sans Thai (via `@fontsource`).** It does **not** ship Inter.
Yet **49 font-stack references across 7 source files named Inter** — the
design language of a *different* project — and the whitepaper's prose named
it once more, for **50 in all**.

The reference is dead, and a dead font-family name does not fail loudly.
It falls through to whatever is next in the stack, and what is next is
different for each rule. Measured by matching canvas text width against
each candidate face (same sample string, 40 px):

| declared stack | measured width | what it actually drew |
|---|---|---|
| `'Inter', monospace` | **909.36 px** | the **system monospace** — identical to `monospace` (909.36 px) |
| `'Inter', 'IBM Plex Sans Thai', sans-serif` | **794.28 px** | **IBM Plex Sans Thai** — identical to `'IBM Plex Sans Thai', sans-serif` (794.28 px) |
| the house stack | 804.49 px | Libre Franklin |

So the fall-through was silent and total: five panel families and every
map label that asked for Inter were drawn in a **face the product does not
own**, while the layers beside them on the same map were drawn in the house
Latin face. Two type systems, side by side, with nothing to indicate it.

## Found, and what it cost

1. **Five panel families were not the product's typeface.** `.lcr` (the live
   cascade rail), `.fsc` (flood-safety cards), `.ffa` (flash flood), `.mtr`
   (metro infographic) and `.tsr` (ThaiWater strip) declared
   `'Inter', 'IBM Plex Sans Thai', sans-serif` and rendered in IBM Plex
   Sans Thai's Latin subset. Their **numerals** declared `'Inter', monospace`
   and rendered in the **system Courier** — the unmistakable look of an
   unfinished build.
2. **The map carried two type systems at once.** `layers.ts` asked for the
   house Latin face; `hydroMap.ts`, `cityPois.ts`, `riverArrows.ts`,
   `WaterNetwork.tsx` and `WaterFlowPicture.tsx` — **37 label layers in
   all** — asked for Inter, and so rendered in IBM Plex Sans Thai while the
   labels next to them rendered in Libre Franklin.
3. **The landmark search input rendered in Arial.** A form control does not
   inherit `font-family`, and `.building-search-input` set a size but never
   a face, so the browser's UA default for `<input>` applied — in the one
   field an operator types into.
4. **MapLibre's own chrome was in Helvetica Neue.** The library's
   stylesheet sets `.maplibregl-map { font: 12px/20px Helvetica Neue, … }`
   and every control inside it inherits that face.
5. **The whitepaper told users the product uses Inter.** The architecture
   section shipped a false claim — `<strong>Inter</strong> (one
   neo-grotesque family, every weight)` — and described the design DNA as
   *"NYCTA Graphics Standards… a closed 8-color route palette for
   wayfinding only — no rounding"*, which is a **different project's**
   design language, not this one.

## Changed

- **One map face, in one place.** A new `src/map/fonts.ts` owns
  `MAP_FONT` — the house Latin face with the house Thai face behind it —
  and all six map modules import it. No map layer names a font that does
  not ship.
- **The panels use the tokens.** The seven `'Inter', 'IBM Plex Sans Thai',
  sans-serif` declarations became `var(--font-sans)`; the five numeric
  ones became `var(--font-mono)` with `font-variant-numeric: tabular-nums`,
  which is this codebase's own idiom for figures that must line up.
- **The search input inherits the house face**, and **MapLibre's controls
  are normalised** in `system.css` — the file that exists to normalise
  legacy and third-party rules, and is loaded last on purpose.
- **The whitepaper tells the truth.** It now names Libre Franklin and IBM
  Plex Sans Thai, and describes this product's DNA — black and white carry
  the interface, colour is reserved for status, one accent, one family, a
  bento-box composition.

## Verified

| | before | after |
|---|---|---|
| Elements naming a font the product does not ship | **50** (49 stacks across 7 files + 1 claim in the whitepaper) | **0** |
| Typefaces the **rendered** interface asks for | Libre Franklin, plus **IBM Plex Sans Thai's Latin** (5 panel families, 37 map layers), **system Courier** (every numeral), **Arial** (the search input) and **Helvetica Neue** (the map's controls) | **Libre Franklin + IBM Plex Sans Thai** — 665 and 7 elements, and nothing else |
| The two trigger count badges | system Courier, 11 px | **Libre Franklin, 11 px, `tabular-nums`**, 0 px clipped |
| The landmark search input | Arial, 14 px | **Libre Franklin**, 14 px |
| The map's own controls | Helvetica Neue, 12 px | **Libre Franklin**, 12 px |
| 72-surface sweep, 390 / 1024 / 1440 | — | **0 regressions** in clipping, overflow and holes; **0 horizontal overflow**; touch targets under 44 px **down on every 390 px surface** (5→3, 12→10, 16→14, 17→15) |

The census that proved the fix walks every element in the document and reads
its computed `font-family`. After the change the **rendered** interface asks
for exactly two families — **665 elements in Libre Franklin, 7 in IBM Plex
Sans Thai** — and nothing else. The 49 `Times` hits in that census are the
non-rendered `<head>` elements (`meta`, `title`, `script`, `style`), which
draw nothing. The two faces are confirmed loaded in the document at render
time (`document.fonts`: *Libre Franklin Variable*, *IBM Plex Sans Thai*).

**One limit, stated plainly.** The map's labels changed face, so their widths
changed with them. The full 72-surface sweep was re-run after the change and
found no new clipping, no new overflow and no new holes at any width, and
the flood lens — the label-densest surface, carrying the street names, the
hydro network and the river gauges — was compared before and after: the
labels are in place, legible, and not colliding. Two of the changed files
draw into the map's canvas rather than the DOM, so a DOM census cannot see
them: `WaterFlowPicture.tsx` is **not currently mounted** by any component
(only its own test reads it), and `WaterNetwork.tsx` draws deck.gl text
layers over the canvas. Their `fontFamily` is now `MAP_FONT` in source, and
the two faces it names are both confirmed loaded in the document.
