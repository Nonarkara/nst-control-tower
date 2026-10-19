# NST operational readiness audit — 19 October 2026

Scope: current main and the existing public NST Pages/Workers deployment. No database migrations, provider credential changes, or sibling services were performed.

## Confirmed defects fixed

- Browser requests now keep cancellation and deadlines through JSON body consumption. Permanent client errors stop immediately; retries and backoff cancel on navigation. Polls schedule after completion rather than cancelling a slow request on the next interval.
- Feed ages advance while a dashboard remains open and across offline reloads. Unchanged upstream timestamps no longer suppress updated freshness or source notes. Failed refreshes label retained data as cached immediately.
- Relay readings expire against actual observation timestamps as well as the relay's reported age. Frozen relay snapshots cannot keep old observations fresh. Malformed offset timestamps are rejected without throwing away healthy stations, and implausible future sensor timestamps are excluded. Each relay attempt has a ten-second deadline after the eight-second direct-provider attempt.
- Basin stress ratios and automatic ponding suggestions are withheld when observed basin rainfall, required forecast days/grid cells, or coastal tide inputs are missing. Missing rain no longer implies dry ground. Measured zero rain remains valid. Official measured danger still takes precedence. Model panels hide incomplete inflow comparisons and explain missing inputs in Thai and English.
- Forecast responses expire by model-generation time, select a single latest run, remove duplicate targets, and return nearest future targets in chronological order. Future target timestamps alone no longer make an old run current.
- Health reports UNKNOWN before observations, marks first failures without prior success as degraded, and does not mark successful stale responses healthy. Overall degraded coverage is no longer shown as healthy.
- Generic references to an airport, city hall or railway station cannot geolocate international news to NST. Local news labels require explicit NST locality evidence, including for previously cached articles.
- Tablet search no longer shares a row with overlapping map actions. Lens controls have enough width for whole English labels.

## Live data and operational limits

Initial public probes at approximately 21:15–21:16 Asia/Bangkok:

- Weather returned one live snapshot; air quality returned an Open-Meteo model estimate, not a ground sensor.
- WRF outlook returned three days from model run `2026-10-18_12UTC`.
- Water gauges, rain stations and basin balance returned empty unavailable envelopes after approximately 39 seconds. Direct HII requests from this Thai machine returned HTTP 200 quickly, while the public FloodDash relay timed out. This is an observed upstream/egress availability problem, not evidence of safe river conditions. Release reduces the relay wait and preserves UNKNOWN honestly; it does not claim to repair another project's relay or guarantee provider availability.
- Public forecast response contained no points. Public Worker database diagnostics reported no configured database. The removed Python forecast producer is documented in `apps/forecast/README.md`; this release does not invent predictions or provision a new production producer.
- API process health was HTTP 200 on production commit `a0a6d23` before release. Process availability and useful sensor coverage are separate checks.

The basin ledger remains a first-order explanatory scenario with geometric catchments and fixed capacity assumptions, not a validated hydraulic warning model. CV events and twin fallback state remain per-isolate unless durable storage is provisioned. Official warnings remain authoritative.

The previously exposed AirLabs credential still requires provider-side revocation/rotation as recorded in the 15 October report. No provider-side rotation is claimed by this audit.

## Verification and release procedure

- Baseline: 1,785 unit tests and workspace typechecks passed; production dependency audit reported zero known vulnerabilities.
- Final unit verification: 43 shared, 708 API, and 1,055 web tests passed (1,806 total; web combines the complete suite with the final nine-case polling regression run). Workspace typechecks and Worker dry-run passed.
- New regression coverage exercises stalled response bodies, cancellation, retry policy, offline ageing, frozen relay snapshots, malformed/future sensor timestamps, missing basin inputs/NODATA versus measured zero, forecast expiry/run ordering, health honesty, and news locality.
- Independent screenshot review at 1440, 1024 and 390 pixels found the two corrected layout defects and the news locality defect. Mobile/tablet captures had no uncaught browser exceptions or horizontal page overflow. Screenshots and live probe evidence are retained in ignored `var/audit-2026-10-19/`.
- Release gates: workspace typecheck, API/web builds, complete unit suites, production dependency audit, production-mode browser tests in CI, and existing same-commit deployment checks. The deploy build omits the test-only camera probe and does not publish local client keys.

Do not interpret a successful software release as restored live flood telemetry. Confirm current gauge/rain coverage before an operational flood briefing; absent telemetry must remain UNKNOWN.
