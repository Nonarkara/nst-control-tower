# NST flood readiness and mayor briefing review — 26 October 2026

## Scope and initial state

Reviewed MiniMax's committed work through d63eb72, including the mayor desk, EWS continuity, translation chain and header status corrections. There were no uncommitted files and no other Git worktrees. One local documentation commit was ahead of origin; it corrects a measurement claim and is preserved. Earlier reports are dated observations, not current sign-off.

Compared the CNX governor briefing implementation in `/Volumes/Data/Projects/CNX`: distinct hazards with sources/ages, conservative action text, Thai LINE copy and printing. NST's existing `/mayor-desk` is retained and improved; `/flood-ops` remains the detailed evidence record.

At09:33 ICT, production readiness returned200:22/22 recent usable water observations,130/134 recent rain observations and73/86 recent EWS observations. This proves a successful source check at that moment, not coverage of all neighborhoods. Later probes encountered DWR unavailability/cache fallback. The Mac/SQLite relay remains a shared dependency; no origin, database, tunnel or DNS changes were made in this audit.

## Findings and fixes

1. **Stale DWR alerts became current declarations.** The mayor desk selected status before testing its clock and fell back to an old threshold if all current comparisons were missing. Only valid observations within120minutes/five-minute future tolerance can now drive current declarations/comparisons. Highest current tier wins regardless of input order. The detailed briefing applies the same clock to official status and measured soil moisture, retaining dated historical table rows separately.
2. **Wrong issuing agency in Thai.** DWR readings were labeled อต. and an erroneous department name. DWR-only station/status/threshold text now namesกรมทรัพยากรน้ำ(DWR); actual TMD bulletins and rainfall criteria retain TMD attribution. See [DWR](https://www.dwr.go.th/) and [TMD rain criteria](https://www5.tmd.go.th/info/เกณฑ์อากาศ).
3. **Missing trend became steady.** A stable label requires a previous measured level; absent motion is unknown. Explicit rising/falling evidence remains visible.
4. **Cache and coverage disappeared in synthesis.** Parts now retain source retrieval time/tier/note and incomplete coverage, without canceling valid observed hazards. Missing bank datums, absent rain totals, known expired stations and missing model points count as incomplete. Nonfinite values cannot grade conditions. Rain thresholds match35.1/90.1mm bands; the fixed24h forecast window expires after30minutes, matching the detailed briefing.
5. **Long-open/offline pages kept a current headline.** A shared clock guard runs after the API's outer cache, on browser ticks, and at copy time. Expired parts and a synthesis stalled over5minutes become unconfirmed with previous evidence explicitly labeled. Future/invalid clocks fail closed. No timestamp is renewed merely by reading cached data.
6. **Mayor could not forward the compact brief.** Added timestamped Thai LINE copy, concise print action, evidence link and duty-officer follow-up beside the warning. Copy failure is visible; initial source failure still allows retry. This is decision support, not a generated evacuation order.
7. **Phone controls inflated and old content displaced current evidence.** Removed broad mobile link padding, redundant header navigation and duplicated leading evidence. Header changes from143px to105px at390×844 and75px to57px at1440×900. Expired TMD reference and additional news use keyboard-operable disclosures; fresh measured rainfall precedes historical official detail on phones unless a current declared alert leads. Earned content remains available, with no nested scroll box.
Independent review also found a232px tablet gap where the neighboring official panel stretched the river row. Independent measurement/context columns reduce that to12px. Disclosure targets include their padding in the44px minimum, retaining visible2px keyboard focus.

8. **Machine translations materially mistranslated two headlines.** Retained originals and marked every automatic translation as unverified. This is a limitation, not a claim that the underlying model's translation quality was repaired. Late translation work is attached to the originating Worker request while the response retains its hard deadline; completed races clear their deadline timer.

9. **Real cold-source brief exceeded the browser timeout after release.** Production returned one mayor-desk response in26.6s while the browser allows25s. The source fan-out now has a14s deadline per source, followed by at most6s for translation. Slow sources become explicit gaps; completed sources remain usable. Late I/O is attached to the same Worker request. This is a failure-path budget, not a claim about upstream speed.

## Verification and evidence

Baseline: shared43, API804 and web1,151 tests passed; type checks passed. After repair: shared46, API810 and web1,152 tests passed (2,008 total); type checks and production dependency audit passed. The17 affected browser checks passed, followed by9 mayor-desk checks after the tablet repair. New regressions cover expired/future/invalid DWR clocks, tier ordering, stale soil observations, missing trend, partial rainfall, fixed forecast horizon, stalled browser/copy clocks and Worker translation lifetime. Browser checks exercise copy, print invocation, retry and detailed flood briefing. Final release checks and production observations are recorded under `var/audit-2026-10-26/` and in GitHub CI for the released commit.

Rendered main dashboard and mayor desk at390×844,1024×900,1440×900 using current source data; local audited synthesis is identified in its fixture metadata. Production probes are kept separately. Captures: `before-*`, `after-*`, expanded/focused disclosures and geometry JSON. No source scan is called a visual pass. Independent review identified the agency, trend, coverage, translation and repeated-evidence defects and reviewed repairs.

Chrome cost for desk:390px105/844=12.4%;1024px57/900=6.3%;1440px57/900=6.3%; no fixed bottom chrome on this route. Main dashboard retains its map and brief navigation. Reading order is warning→next action→source evidence. The page may scroll with real content; no universal one-screen claim is made. Before/after source payloads were captured at different moments, so document-height differences are not a controlled speed/size comparison. Expanded details, absent feeds and keyboard focus must remain usable.

## Operational limits

Readiness is feed availability, not flood safety or municipal coverage certification. DWR can flap, sensor observations are older than retrieval clocks, and a single Mac relay is not independent failover. A hardcoded TMD bulletin from20October remains expired reference material; the mayor desk explicitly links to the latest official notice without claiming to have fetched it. News translation quality is unverified. No calibrated inundation depth, street arrival time, camera water-depth estimate or automatic evacuation authority is established. Use official warnings, duty staff and field verification.
