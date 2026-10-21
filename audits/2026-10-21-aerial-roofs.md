# Aerial roof study — 21 October 2026

## Evidence and scope

Visually compared existing OSM footprints to north-up Esri World Imagery at zoom19 in four1600px windows: Wat Mahathat and nearby Wat Srariang, the City Hall reference area/Wat Wang Tawan Ok, old-town canal/park, and a southern neighbourhood. The source imagery contains clouds, tree cover, joined roof footprints and uncertain registration. Its acquisition date is unknown;21October is the review date, not the image date. Source: https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer.

`roofObservations.json` records272 inspected footprints,16 assigned roof forms and256 unresolved footprints. This is a first reviewed set, not a city-wide roof survey. Other mapped buildings also remain unverified. Every observation has an OSM ID, source area, image label and a reason; source areas include exact centre, zoom, image size and SHA256 of the reviewed aerial image. Source imagery was inspected locally; it is not redistributed in the repo.

## Changes

- Removed the previous rule that inferred a gable from the temple category or a nearby temple POI. A temple precinct can contain flat terraces, service buildings, several intersecting halls and a stupa.
- Reviewed gables have two planes and a metric ridge; reviewed hips have end planes and preserve a ridge on long rectangles rather than becoming pyramids.
- The long hall south of the great chedi has stepped temple roof bands and closed fascia joins. No finials, gilded trim or sculptural ornaments were invented from an aerial image. Its exact end profile and all roof heights remain schematic.
- Reviewed blue roofs retain blue surface colour. Colours are approximate image interpretation, not verified materials.
- Confirmed flat terraces remain flat. Unclassified roofs retain neutral schematic caps and explicitly say unverified, rather than claiming a flat roof was observed. Courtyard holes/complex outlines are preserved; a single ridge is not imposed over joined buildings.
- Reviewed roofs survive the same wall/roof visibility filters, including low zoom, to avoid floating roof-only objects.
- Building cards expose each roof observation and source. The map legend states the reviewed count and limits.

## Chedi registration correction

The nomination coordinate8.411475,99.9662166667 is a site reference, not the round chedi's centre. The aerial overlay places it approximately54m north of the visible chedi. The model and search target now use the approximate centroid of existing round footprint `way/774945305`:8.4109925,99.96619375. The official site reference remains stored separately. This supersedes the anchor used in the earlier hero-temple audit; neither position is claimed as surveyed registration. The source56m height and28m plinth remain. The underlying chedi footprint prism is hidden only when the authored model is enabled, preventing duplicate masses.

## Verification

Geometry tests cover source-to-footprint IDs, no POI-only gables, flat roofs inside temple precincts, finite/bounded coordinates, plan-area conservation, long hip ridges, closed temple bands, wall/roof population consistency and the revised anchor. Responsive browser checks exercise the hero at1440/1024/390px. Additional real-geometry browser cases inspect all four roof forms and their provenance. Independent aerial and rendered-scene review is required before release.

Independent review downgraded8 initially proposed assignments: Mahatat labels20/21/22/29/88 and Oldtown20/35/45. These have ambiguous ridges, curved-looking surfaces, end-plane/wing changes or several roofs per outline; all remain unknown. Rendered scenes passed independent review at1440/1024/390px.

Local verification:1122 web unit tests, typecheck and production build passed. Responsive hero and four-form provenance browser checks passed during development. A final local browser repeat was stopped during host load above60 after a cold-start readiness timeout; the test now waits up to20seconds for the map host, as other readiness checks do. The isolated production-build CI browser suite is the final release gate.
