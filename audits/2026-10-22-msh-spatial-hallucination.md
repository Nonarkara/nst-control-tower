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
