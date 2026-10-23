# NST flood operations release audit — 23 October 2026 (ICT)

Operator task: identify the measured warning, its location and observation time, missing evidence, and the next action without inferring an official order.

## Found

- Public water/rain endpoints returned after about 32 seconds at the initial check, exceeding the browser's 25-second cold attempt and the operations aggregate's 18-second observation budget. A healthy `/api/health` only proved process liveness. Its detailed adapter map was empty on a cold isolate.
- Null/missing readings could produce a green posture and “all stations within banks.” An absent overtopping estimate became “no gauge is on course to overtop.”
- DWR critical status could score only Watch when other inputs were missing. Since-07:00 accumulation was treated as rolling 24-hour rain, and another unverified accumulation as hourly rain.
- District-wide rainfall/soil/channel data were merged and pinned at a single station; separate watersheds generated municipal evacuation stages without a verified routing model.
- Retained browser observations and cached basin ETAs continued to drive current decisions. A session-wide alert acknowledgement could suppress later station escalations.
- The first phone render of the old alert table hid official DWR status to the right of the viewport. Province/name columns repeated identity while consuming the space needed for the warning.

## Changed

- Replaced the automatic evacuation ladder with provincial station evidence. No modeled municipal order or claimed TMD/HII issuer. Proximity village results request urgent local assessment; nearby measurements do not establish village inundation.
- Main-map analysis checks station observation timestamps every minute, with an explicitly displayed 120-minute maximum and five-minute future-clock tolerance. Scenario observations are excluded. Historical EWS map points age to unknown. The dedicated mayor briefing retains its existing stricter 90-minute filter.
- Every automatic main-map decision consumer uses gated data: live synthesis no older than ten minutes, only matching current gauges, recalculated aggregate ETA, and no auto-suggested scenario depth after losing contributing gauges. The adapter labels its analytical ledger as scenario; the recent, explicitly labeled model display remains available separately in Water Balance and the Ops Board, without entering current warnings. Old/unavailable models produce an explicit gap with the board still reachable.
- No all-clear/no-action statement from absent readings or absent ETA. Unknown rainfall remains unknown; measured zero stays zero.
- DWR status 1/2/3 enforces minimum Watch/Prepare/Critical severity. Scores use actual station locations and verified rain windows; no administrative-area merge. Screening is explicitly experimental, uncalibrated and distinct from ONWR FFPI.
- Official DWR Prepare/Critical alerts surface across all map views, including the default view; loss of gauge data directs operators to duty staff and field verification. Critical station/severity sets can reopen an acknowledged warning when they change. Station rows place DWR status, location, timestamp and unknowns together. Critical rows provide a duty-officer instruction and station-map link; calculation details remain available on demand.
- A first failed browser attempt reports unavailable rather than staying loading through a 133-second retry chain. Failed polls recover within a 30-second polling delay. Water/rain/EWS poll once per minute; server water/rain and relay edge caches refresh at one minute, rather than 10/30 minutes and five minutes.
- Upstream retry attempts and rate-limit backoff share one source deadline. Relay fetch budget is 16 seconds, with bounded cache I/O and Worker-lifetime attachment for cache writes.
- Added `/api/health/flood-readiness`: bounded active checks of water, rain and DWR observations; HTTP 503 for missing/degraded essential feeds. It reports availability and incomplete-coverage limits, not flood safety. Liveness remains fast and explicitly separate.
- Reviewed and retained the pending route-loading changes, including the missing LocaleProvider on `/flood-ops`.

## Verified

- Web unit suite: 1,126 tests across 78 files, plus the cold-deadline regression added afterward. API suite: 734 tests across 55 files, plus two endpoint integration tests added afterward. Shared suite: 43 tests. Source deadline, hung cache read, unknown/null/zero, stale/future clock, DWR critical-with-missing-input and HTTP 503/liveness separation cases exercised.
- Type checks for shared/web/API; production web build; Worker deployment dry run; production dependency audit found no known vulnerabilities.
- Five existing mayor-briefing browser checks passed, including missing rainfall while a known near-bank warning remains visible, copy/print controls, English summary, and phone target sizes.
- Three emergency browser checks cover current warning, missing observations, rejection of a cached critical basin ETA, critical DWR without rain, the duty-officer instruction, keyboard focus/Escape and map-action visibility at 390×844, 1024×900 and 1440×900. The synthetic payloads are test scenarios, not current flood intelligence.
- Screenshots and measured JSON: `var/emergency-audit-2026-10-23/{current,missing,critical-dwr}-{390,1024,1440}.{png,json}`. Independent visual review inspected all nine images. Primary warning/uncertainty and suggested action are visible together. No page horizontal overflow. Extra scroll is for station evidence and optional methodology.

| Viewport | Top chrome | Bottom chrome | Combined cost | Reading priorities |
|---|---:|---:|---:|---|
| 390×844 | 52 px | 62 px | 13.5% | warning → evidence/unknowns → action/map |
| 1024×900 | 52 px | 62 px | 12.7% | warning → evidence/unknowns → action/map |
| 1440×900 | 56 px | 49 px | 11.6% | warning rail → map → source/layer controls |

Initial browser failure was a test fixture retaining the same fetchedAt while changing its payload, violating the feed identity contract; advancing the fixture timestamp fixed the test. This was not presented as a product pass. The first visual iteration exposed the hidden official-status column; the station-row replacement was rendered again.

## Release gate and remaining limits

Deploy only through the existing successful-main-test workflow, which deploys web and API from the same tested SHA and verifies the bundle on both public and Pages domains plus the API version. Post-release source availability/latency evidence belongs in `var/emergency-audit-2026-10-23/live-verification.json`; availability must not be inferred from process health.

This is a scoped emergency audit, not certification of every lens, source or municipal SOP. Live meteorological conclusions, watershed travel time, inundation depth and camera-derived water levels are not established by these tests. Camera/CV outputs require usable current imagery, local calibration and human verification. Source outages, silent stations and upstream dependence on FloodDash remain operational limits. Unknown must remain visible; consult official warnings and field staff.
