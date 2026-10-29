# NST mayor city flyover and flood what-if — 30 October 2026

Task: show the mayor a geographically grounded city flyover, with recognizable temple/roof forms and an honest road-level flood comparison. The city map is dominant; controls explain the evidence and restore the operator's prior task.

## Findings and corrections

- The city fabric was artificially thinned by alphabetical ID (70% of anonymous footprints). Walls and roofs now share the same complete city-scale population; province zoom deliberately suppresses subpixel anonymous buildings.
- Original map data: 2,458 footprints. Added 15,463 Microsoft satellite-derived detections after OSM-first overlap filtering, within the municipality plus eastern HII survey scope. The6MB infill asset is lazy-loaded for3D only, protecting the cold2D flood brief from that transfer. Total source footprints:17,921, before chedi duplicate suppression. This is improved coverage, **not a completeness claim**. Heights remain null in the source; rendered heights use existing declared estimates.
- Reviewed 136 additional aerial candidates in the old-town south area. Added 25 roof-form assignments (41 total including the previous 16); unresolved forms remain unknown. Three clearly open courts/parking areas no longer extrude as false buildings. Independent aerial review downgraded nine uncertain interpretations before release.
- Projected existing Esri imagery onto footprint-constrained roof triangles. Courtyard holes and tile seams are preserved; neutral roofs remain if imagery fails. This is a schematic model with aerial appearance, **not drone photogrammetry, surveyed facade detail or verified citywide roof geometry**.
- Added a five-stop task view: Wat Mahathat, old town, mountains/city/coast, city canals, eastern surveyed lowland. Automatic motion respects reduced motion; manual map interactions pause it, Escape/End restores the prior map. The temple remains an authored chedi reconstruction, not a scan.
- HII surveyed-road points were hidden under the Esri raster. They now render above raster and below physical vectors. Point size reflects a road comparison rather than invented broad flood coverage.
- Map legend no longer issues village evacuation commands or describes schematic channel arrows as measured flow. Register flags require local verification.
- Replaced “God Mode”, actual inundation and vehicle-passability assertions with explicit hypothetical level-minus-road language. Existing 1.24m and 2.12m MSL presets refer to historical surveyed marks, not current gauges or citywide uniform water surfaces.
- Critical static geographic assets now have a 10s per-attempt/body deadline, bounded retries and contract validation; missing/malformed survey data disables the what-if instead of implying safety or a result.

## Geographic and source limits

HII 2025 road survey: 18,359 points, roughly 55.7km represented by bounded same-route neighbor gaps. Bounds [99.99242,8.3968,100.07248,8.48678], mainly eastern lowland. The comparison is `selected level − surveyed road elevation`, on the shipped mMSL datum. It excludes hydraulic connectivity, drainage/pumps, bridge hydraulics, tide timing, runoff routing and arrival time. Points below a level do not prove water will reach them. No evacuation orders or calibrated camera-depth claims are produced.

Existing regional terrain-grid sampling is approximately 2.3km east-west by2.85km north-south, insufficient for street-level inundation. Hand-drawn historic/risk polygons and heuristic flow arrows are excluded from the demo. Khao Luang is west of the city; Tapi, Khlong Klai and Pak Phanang are not presented as one inflow path. A calibrated forecast requires finer bare-earth terrain, hydraulic structures and boundary conditions validated by local authorities.

Microsoft source: https://github.com/microsoft/GlobalMLBuildingFootprints, pinned 2026-08-13 index. CDLA-Permissive2.0 license and original Microsoft license notice shipped beside data. `building-coverage.json` records tile URLs/hashes, extraction scope, overlap rule and excluded counts. Script: `apps/web/scripts/build-nst-building-infill.py`; it does not use the legacy Yala-only MS extractor.

Esri World Imagery: https://goto.arcgisonline.com/maps/World_Imagery. Runtime imagery remains with the attributed provider. Actual image acquisition dates and building dimensions are unknown. Roof-review evidence includes export extent/request/hash, candidate ID bindings and contact sheets in `/Volumes/Data/agent-artifacts/NST/2026-10-30-mayor-3d`.

## MSH evidence

Found: the first phone flood panel occupied487px and its bottom caveat fell behind fixed navigation. The tablet panel also extended under navigation. Initial screenshots taken during camera motion were excluded as final framing evidence.

Changed: removed the duplicate flood explanation, grouped level/presets/slider/result/key, retained a visible forecast limitation, and made supporting survey assumptions an explicit disclosure. Anchored controls above mobile navigation; compass/zoom/ASK occupy separate edges. All control targets remain44px; visible focus is a2px outline. Mobile imagery attribution remains visible.

Verified locally in real IAB at390×844,1024×900,1440×900: temple close-up, old-town imagery, flood level2.12m, expanded limits, expanded desktop provenance and keyboard focus. Horizontal overflow0 at390. Phone top52px + bottom62px =114px (13.5% of viewport); tablet114px/900=12.7%. Desktop header/status measurements and final release evidence recorded with the release handoff. Primary priority: city/geography; second: current stop or selected comparison; third: provenance and supporting assumptions. Scrolling is not needed for the map task. Expanded phone assumptions intentionally use more map space and finish above navigation.

Independent review: aerial interpretations and source/layer/lifecycle review by visual_review; runtime/viewport review scoped to these actual states. Does not certify every dashboard lens or complete flood readiness.

## Validation and release

Focused mesh, building population, roof evidence, static asset and scenario tests; web typecheck. Regression browser tests cover3 widths, reduced-motion controls/restoration, malformed assets and disabled what-if. Full unit/browser/build/deploy gates run in the established CI workflow; exact results and live verification belong in the durable release handoff.

## Operational observation

Readiness before release,2026-10-29T19:39:20Z: HTTP503, water22 recent usable, rain138/140 recent usable; oldest observations about99minutes. DWR returned HTTP530 (prior audit403). This is source unavailability, not evidence of safe conditions. `readiness-before.json` preserves the response and observation ages. No observation clocks were renewed. The web domain's `/api/...` URL serves SPA HTML; readiness evidence uses the configured API Worker origin.

Remaining: citywide per-building roof review, measured heights, surveyed temple detail, calibrated street hydraulics and camera water-depth calibration are unfinished. Satellite footprint detections can omit/add/misregister structures. Live source availability is independently monitored; improved graphics do not resolve missing DWR observations.
