# Paper and operational-system reconciliation — 4 November 2026

Task: let a mayor distinguish current evidence, official declarations and the next verification task, with claims that match implemented behavior. Baseline is Claude's tested/deployed6606de6; its city narrative and eight-page format are retained. Changes are isolated from the original checkout.

## Found and changed

- DWR supplied absent/invalid dates were replaced by retrieval time. Although flagged stale, those records carried invented measurement clocks. Missing clocks now remain empty; the parser rejects impossible dates, hours and malformed suffixes, and future reports are stale. Valid Thai Buddhist-era, Gregorian and leap-day cases remain supported. No real observation is restamped.
- English DWR non-alert sentences implied a province-wide all-clear despite incomplete records. They now refer only to current reporting stations, with an English coverage denominator. Thai alert thresholds and ordering are unchanged.
- The flood briefing displayed nonnumeric ages for unknown clocks. It now displays an em dash and retains the missing-reference qualification in Thai, English and copied evidence. Soil measurements and missing soil data identify DWR; rainfall classes identify TMD.
- The restored opening called a rainfall-based wetness proxy soil moisture, and implied full provincial alert coverage. It now distinguishes the proxy and returned current records. Figure4 names the implemented Traffy/Facebook adapters instead of suggesting direct@NakhonCity ingestion. Decision-brief authority precedence is distinguished from the compact water-only map band. Retrospective observations are not presented as preregistered methods. The mayor, depa and Taipei/Refill City narrative remains attributed secondary evidence.

## Claim-to-capability boundary

| Claim | Evidence and boundary |
|---|---|
| Source/observation clocks | DWR parser and normalization regression checks; missing clocks remain unknown, never retrieval time |
| Authority first | Mayor and flood-watch brief ordering; compact map strip is specifically water-focused |
| Missing is not safe | Readiness scope, excluded counts, synthesis unknown states and missing-source UI |
| Human verification | Manual LINE copy, printing and station evidence; no authorized delivery/receipt integration established |
| Camera support | Daylight sampling and haze/sensor comparison wired; water/haze calibration and field performance unproven |
| Hydrology/digital twin | Screening/model capabilities; not surveyed drainage capacity, calibrated inundation or arrival times |
| Connected civic data | Traffy/municipal Facebook adapters;@NakhonCity is documentary context, not an implemented direct source |
| Governance outcomes | Historical narrative attributed to report/portfolio; no independent adoption or public-safety outcome evidence |

## Verification

Tests first reproduced three API clock/scope failures and the missing-age formatting failure. Focused API suite:71tests across4files passed; focused web checks and typechecks recorded in retained artifacts. New browser cases exercise undatedDWR evidence in both languages at390/1024/1440 and distinguish measured/missing DWR soil from TMD rain criteria. Full production build and browser suite run remotely through the established CI gate. No routine local full build/load test or unrelated service restart.

All eight rebuilt PDF pages received independent visual review. Real research previews at390×844 and1024×900 retain49pxheader (5.8%/5.4% of height),46pxdownload on first screen, readable article measure and no horizontal overflow. The local1440 capture lagged the viewport override and is unverified; definitive CI and production captures are required. No new layout geometry was introduced; deeper scrolling earns paper evidence. Source states, keyboard focus and expanded controls are retained in existing CI evidence; final changed-state and live evidence/run IDs are recorded separately.

At15:32UTC, bounded live checks confirmed deployment6606de6 and availability of recent water/rain/DWR observations. Direct feeds had separate cache clocks, including a94-minute water snapshot; mayor evidence retained independent clocks. Coverage remained incomplete. This is source availability, not safety certification.

Artifacts: /Volumes/Data/agent-artifacts/NST/2026-11-04-claim-integrity. Release status and limits: var/audit-2026-11-04-claim-integrity/. Rendering/CI/source review do not certify official authority, calibrated camera depths, institutional ownership or field outcomes. Author contributions and participation confirmation remain author tasks before journal submission.
