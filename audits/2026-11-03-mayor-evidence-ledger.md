# Mayor desk — compact evidence ledger

Task: let the mayor read the situation, choose a verification action and compare source evidence without paying for empty panel geometry.

## Found

The previous visual signoff was too permissive: it checked clipping and usability without sufficiently challenging reading cost. The owner's three screenshots identify the actual failures:

- The answer occupied a full-width band while its text stopped well before the right edge. The action and timestamp were stacked below, making the band unnecessarily tall.
- Repeated framed river/rain/forecast/DWR panels imposed the same visual weight on different evidence. Status chips sat far from their source labels.
- Prose and station values formed long undifferentiated rows. DWR and news shared one column, making the page's travel depend on unrelated content.
- Footer links mixed long labels with qualifications, producing an orphan final word on phone.

## Changed

- Bound the page to 1,160 px and pair the answer with its verification action and metadata on larger screens. Phone retains a deliberate reading sequence.
- Replace panel frames and independent card columns with source rows: label/status → explanation and original clocks → station/value evidence. Row height follows actual content; there are no fixed or minimum panel heights.
- Keep severity beside its label. Split the provider's existing em-dash text into display columns, without parsing numbers, inferring units or changing the source text. Keep headroom and trend qualifications on readable lines.
- Separate news into its own reading group, with columns on larger screens and a single reading column on phone. All original headlines, translations and qualifications remain.
- Group TMD reference/latest actions and shorten visible footer link labels while retaining descriptive accessible names and all destinations.
- Declared official alerts precede other source rows at all widths. No change to authority detection, source severity, age policies or measurements.
- Give printed warnings dark ink, links a readable blue, outlined status labels and a white page even when the screen theme is dark. Screen controls keep usable targets; paper does not reserve touch-target padding.

## Verified

The comparison uses the **same recorded public response with its original timestamps**, with the browser clock fixed at 19:33 UTC on 2 November 2026. Historical observations were not restamped or served as current production data. Images are labelled fixture evidence, not live conditions.

| Viewport | Before page height | After page height | Change | Before/after answer height |
|---|---:|---:|---:|---:|
|390×844|2,171 px|1,824 px|−347 px (16.0%)|215 →209 px|
|1024×900|1,231 px|1,047 px|−184 px (14.9%)|177 →104 px|
|1440×900|1,198 px|1,063 px|−135 px (11.3%)|197 →109 px|

The same data still takes more than one phone screen; deeper travel earns its place with station evidence, source dates and news. No numerical evidence was removed to force a fit. Body type remains 14 px and source/evidence text at least 13 px. Measurements and full/first-screen screenshots are under `/Volumes/Data/agent-artifacts/NST/2026-11-03-compact` (`before/after-*.json/png`).

Top chrome, including the outer inset, falls from 117 to 109 px on phone (13.9% →12.9% of844 px), and73 to65 px on tablet/desktop (8.1% →7.2% of900 px). There is no fixed bottom chrome on this page.

First-screen hierarchy: situation → verification action/qualification → source rows. Header actions and the answer remain together. The former blank right side of the answer now carries the verification task. No lateral card frame suggests that empty width is missing content. On phone the river and rain readings reach farther into the first screen than before.

Focused browser checks cover all existing mayor behavior plus 3 viewport cases with populated evidence, translations, keyboard focus, dark theme, expanded TMD/news, missing data, declared-alert priority and print contrast. The synthetic declared-alert fixture is explicitly labelled as a test; it validates ordering, not an actual DWR warning. Copy/print payload, original clock guards and unavailable-source wording remain intact.

Independent review challenged the geometry and caught a broken trend phrase and low-contrast print warnings; both were repaired. Final review/release outcomes and actual production screenshots are recorded in `var/audit-2026-11-03-compact/release.md`.

## Remaining / limits

This is a scoped mayor-desk composition change. It does not certify operational flood readiness, repair upstream source availability, add hydraulic calibration, or turn schematic 3D into photogrammetry. A4 pagination was not asserted from a print-media screenshot; printed colour/readability and retained qualifications were checked. The prior non-reachable moderate Node static-serving advisory remains tracked in the operational audit.

No unrelated services or other agents' work were changed. Pre-existing untracked `apps/web/playwright.tmpport.config.ts` remains excluded. Local checks used one browser worker and Vite; full production builds and suite gates run in the established remote CI.
