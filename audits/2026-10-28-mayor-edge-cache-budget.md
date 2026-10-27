# NST heartbeat: mayor edge-cache response budget — 28 October 2026

## Found

Reviewed deployed `e5c0380`; preserved another actor's untracked `apps/web/playwright.tmpport.config.ts`. The new shared last-desk cache improves cold delivery, but its `match`, response-body read and `put` had no deadlines. A stalled read ran before the source budgets; a stalled write held back completed evidence. A malformed snapshot could crash ageing before fresh synthesis. Four regressions failed against the original code: hung read, body and write, and a malformed envelope.

## Changed

Bound each optional cache I/O operation to one second. Move the bounded write to the originating Worker's background lifetime. Validate the four current parts, basic news/gap fields and original generation/retrieval clocks before seeding. Reject future or expired snapshots without renewing their clocks. Existing observation/source ageing remains intact. No UI, origin, database, tunnel, DNS or live-service changes.

## Verified

All **819 API tests across 63 files** passed locally with two workers; the focused four-file check passed 60 tests, and API type checking passed. Cases cover hung I/O, request-lifetime attachment, malformed/extra rows, future/expired clocks, and retained hazardous observations under optional-source failure.

The first CI attempt was blocked by three unrelated Google Trends contract-test timeouts. The provider stub is now resolved during test setup rather than inside timed assertions. No production Trends code or global timeout was changed. Full CI, deployment and live probes are recorded separately under `var/heartbeat-2026-10-28/`.

Reviewed the changed production UI at **390×844, 1024×900 and 1440×900**: mayor desk, detailed flood briefing and main dashboard, plus expanded mayor disclosures and keyboard focus. Independent review found no clipping/overflow blocker. Warning → action → source remains clear; the map and station evidence are preserved. Detailed-briefing scroll is earned by station/model evidence. This is a review of these surfaces, not every lens/menu or a universal one-screen claim.

| Surface | 390 px chrome | 1024 px chrome | 1440 px chrome |
|---|---:|---:|---:|
| Mayor desk | 105 px / 12.4% | 57 px / 6.3% | 57 px / 6.3% |
| Detailed briefing | 148.2 px / 17.6% | 57 px / 6.3% | 57 px / 6.3% |
| Main, top + bottom | 114 px / 13.5% | 114 px / 12.7% | 56 px / 6.2% |

Desk/briefing headers are in normal flow. The main-row figures refer to the measured selected state; all geometry and region positions are retained in the JSON. Expanded content retains readable text and a visible 2 px focus outline.

Durable screenshots: `/Volumes/Data/agent-artifacts/NST/2026-10-28/`. Geometry/error JSON is also under `var/heartbeat-2026-10-28/geometry.json`. Temporary scripts and browser profiles used `/Volumes/Data/agent-scratch/nst-hb-20261028-edge/` and are removed at completion.

## Remaining

At **01:19 ICT**, active readiness returned **503**: water had 14 current usable observations, rain 47, and DWR failed with HTTP 522. This is source availability evidence, not an all-clear. The shared relay was not restarted or altered. Upstream intermittency and partial station coverage remain limits; timestamps and uncertainty must stay visible. Machine translations remain unverified; no calibrated camera depth or automatic evacuation authority is claimed.
