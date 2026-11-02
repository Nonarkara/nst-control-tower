# NST operational recovery audit — 3 November 2026 (ICT)

Task: give the mayor a timestamped, readable situation brief and usable evidence without mistaking unavailable observations for safety.

## Found and repaired

- The synthesized mayor briefing could survive indefinitely: cache retry cooldowns and persistence renewed expiry without bounding the original payload age. Added an opt-in retention predicate across fresh, cooldown, background, foreground and shared-result paths; only the mayor adapter opts in. Both original generation/retrieval clocks must be within 15 minutes. Historical/static feeds retain their existing policies. An expired memory entry cannot block newer edge evidence.
- The browser could seed the mayor page from a two-hour-old briefing whose storage write was recent. The same shared 15-minute limit now applies to its original `loadedAt`, independently of `savedAt`. Existing observation-age guards and other feeds' offline behavior remain intact.
- A relay cache fetched recently could contain no usable observations within the existing two-hour source limit. Such a wholly expired snapshot now awaits the existing bounded origin refresh. A usable partial water/rain feed still serves immediately, preserving continuity.
- The mayor's 14-second source wait could discard a usable cold relay response. Water/rain and DWR now receive 18 seconds; optional context retains 14 seconds. Headline translation uses only the remainder of a 22-second total budget measured before the edge read, inside the browser's 25-second request deadline.
- English flood reports using “flooded”, “floods” or “inundation” missed the flood tag. Added inflected forms and explicit figurative-phrase controls; separate literal flooding in the same report remains tagged.

The live main dashboard also contained generic “1–3 h” arrival and “within the hour” readiness advice without a local arrival model. Replaced those strings with local verification/transport-readiness guidance; landslide and standing-water text now requests local assessment rather than asserting a sequence or issuing movement instructions. Ranking inputs and thresholds are unchanged.

No source observation timestamps are renewed. A retained synthesis still ages into an incomplete answer after five minutes. Missing stations, stale observations and unavailable DWR remain explicit; no all-clear is inferred.

## Evidence and scope

Baseline: deployed web/API `bb3c5aa90c1ba35e6e8f7b0a1e8ec312613bba1f`; last durable comparison `var/heartbeat-2026-11-02T1749Z`. Initial bounded checks are in `var/audit-2026-11-03T0149ICT`.

At 01:50 ICT the readiness endpoint returned 200: 21 recent water observations, 121 recent rain observations and 74 recent DWR records. This was a source-availability improvement over the prior DWR 522, not a certification of city safety. Twenty-nine water and 35 rain stations remained excluded. The separately cached mayor response retained original source clocks. Later browser evidence showed DWR unavailable again; intermittent availability must remain visible.

Regression tests reproduced five cache-retention failures, two wholly expired relay hits, seven missed flood word forms, and the browser seed issue. Added tests cover failure crossing the retention boundary, renewed retry/persistence clocks, shared callers, partial-feed continuity, cold-source/edge/translation budgets and browser reopening. Independent read-only source review passed with no blocker.

Local checks: workspace typecheck passed; focused nine-file API suite passed 116 tests; browser hook suite passed 13 tests. Full backend and CI release results are recorded with the final release evidence rather than predicted here. Production builds and full browser tests run in established CI, not on the service host.

## MSH review

Before release, the real mayor desk was inspected at 390×844, 1024×900 and 1440×900. Header cost: 105 px (12.4%) on phone, 57 px (6.3%) on larger views; no fixed bottom chrome. The primary answer and actions are visible together; the answer ends at y332, y250 and y270 respectively. Further scrolling reveals station evidence and news rather than empty tracks. No horizontal overflow was observed. Existing independent columns avoid stretching rain to the official panel's height. No CSS change was justified by these views.

Final production screenshots, expanded/missing-data/focus checks, independent visual review and deployed version checks belong in `var/audit-2026-11-03T0149ICT/release.md`; images are stored under `/Volumes/Data/agent-artifacts/NST/2026-11-03-audit`.

## Limits

The digital twin retains schematic/unknown roof heights outside aerial-reviewed forms; imagery projection is not photogrammetry. HII road comparisons are static level comparisons, not calibrated hydraulic forecasts or arrival times. CV remains a human-reviewed image cue without calibrated water depths. This release fixes evidence recovery; it does not add verified roofs, hydraulic calibration, camera availability or official warning authority.

Platform references reviewed: Cloudflare [execution context](https://developers.cloudflare.com/workers/runtime-apis/context/) and [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/). No new bindings, privileges or services were introduced. Pre-existing untracked `apps/web/playwright.tmpport.config.ts` is excluded.
