# NST research draft v1

Public route: `/research`. The HTML reading edition and downloadable PDF are dated research artifacts, not live flood briefings or official warnings. Author contributions and submission approval remain for the authors; the document is not peer reviewed.

## Evidence

`apps/web/public/research/evidence-v1.json` records input hashes, the explicit 32-entry title selection, resource retrieval outcomes, denominators and capture clocks. It distinguishes 10,414 database registry records from the 10,412-record health check. These include non-Thai/global series and are not unique Thai physical gauges.

Recalculate offline from the dated cached inputs (the raw caches are not all public):

```sh
node paper/analyze.mjs --catalog /path/to/manifest.json --snapshots /path/to/captured-json-directory
```

The snapshot directory must contain `fd_health.json`, `fd_sensors_health.json`, `fd_province_stations_code_80.json` and `fd_sources.json`. The script makes no network requests. It recalculates catalog and telemetry aggregates, uses Git ancestors at the pinned cutoff, and counts the captured deployment-workflow records. It **transcribes** the two DWR audit checks from the cited, checksummed audit; it does not derive crossing, issuance, notification or receipt times. Failed/skipped resources remain unclassified.

The 32-entry selection follows the title terms published with the evidence. The earlier broad-keyword selection incorrectly included a safe-transport dataset. The explicit revised rule also includes tide and wildfire entries. No inference of absent interoperability follows from seven agency codes in an already aggregated feed.

## Build and review

```sh
node paper/build.mjs
```

Requires the web app's installed Playwright Chromium and the Charter/Sukhumvit Set fonts used for the reviewed export (fallback fonts can change pagination). This renders print media to PDF and copies the same source as a readable HTML edition. After rebuilding, inspect every rendered page, check embedded fonts and page count, and update `PAPER.pages` if pagination changes. The reviewed PDF has **8 A4 pages**. No routine production app build is required to render the document.

The HTML edition is the embedded reading surface because PDF plugins can be absent in in-app and mobile browsers. The pane uses script-free sandboxed `srcDoc` from the canonical paper source; production retains `X-Frame-Options: DENY` and needs no network-framing exception. PDF download remains available; phones get direct HTML/PDF links rather than a narrow frame.

## Review limits

The local evidence audit corrected the claim of a measured 2.5-hour DWR warning delay, unsupported city drainage-capacity inference, four-month raw-archive scope, catalog retrieval completeness, registry denominators and operational-adoption claims. The two checks are 145 minutes apart; intervening state and official issuance/receipt are unknown. Hydraulic and camera outputs remain uncalibrated decision-support capabilities. External references, affiliations, author approval and field outcomes are not certified by software tests.
