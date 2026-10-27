# NST heartbeat: mayor edge-cache response budget — 28 October 2026

## Found

Reviewed deployed e5c0380 and preserved another actor's untracked`apps/web/playwright.tmpport.config.ts`. The new shared last-desk cache improves cold delivery, but itsCacheAPI `match`,response`json`and`put`were awaited without deadlines. A stalled cache read happened before source budgets started; a stalled write held back completed evidence. A malformed nonempty snapshot could crash `ageMayorDesk`before a fresh source build. Four targeted regressions failed against the original code: hung read/body/write and malformed envelope.

## Changed

Bound each optional cache I/O operation to1second; move the bounded write to the originatingWorker's background lifetime. A cache failure cannot hold the critical response indefinitely. Validate the current four-part envelope, basic news/gap strings and original retrieval/generation clocks before seeding. Reject future or expired snapshots rather than renewing their clocks. Existing observation/source ageing and source deadlines remain intact. NoUI,origin,database,tunnel,DNS or live service changes.

## Verified

60targeted API tests across4files and API type checking passed. Tests include hungcacheI/O,request-lifetime attachment,malformed snapshots,extra invalid rows,future/expired clocks and retained critical evidence under optional-source failure. FullCI/deployment and later probes are recorded separately in`var/heartbeat-2026-10-28/`.

Rendered e5c0380's changed UI using real production data at390×844,1024×900,1440×900: mayor desk,detailed flood briefing and main dashboard,plus expanded mayor disclosures and visible keyboard focus. Independent review found no clipping/overflow blocker; warning→action→source remains clear. The map and detailed station evidence are preserved. Full briefing scroll is earned by station tables/model evidence; no universal one-screen claim. This was review of these surfaces, not certification of every lens/menu.

Screenshots are durable artifacts on the external volume:`/Volumes/Data/agent-artifacts/NST/2026-10-28/`. Geometry/error JSON also copied to`var/heartbeat-2026-10-28/geometry.json`. Temporary scripts,fixtures and browser profiles used`/Volumes/Data/agent-scratch/nst-hb-20261028-edge/`and are removed at completion.

Desk chrome:57pxdesktop/tablet(6.3%of900),105pxphone(12.4%of844),no fixed bottom chrome. Main top/bottom navigation remains separately measured in the geometry record. Task visibility: the desk keeps the worst signal,follow-up action and provenance together before optional evidence/news; expanded details retain readable text and visible2pxfocus.

## Remaining

At01:19ICT,active readiness returned503:water had14current usable observations,rain47,andDWRfailed withHTTP522. This is current availability evidence,not an all-clear. This session did not restart or alter the shared relay. Upstream intermittency and partial station coverage remain operational limits; source/observation clocks and uncertainty must remain visible. Machine translations remain explicitly unverified; no calibrated camera depth or automatic evacuation authority is claimed.
