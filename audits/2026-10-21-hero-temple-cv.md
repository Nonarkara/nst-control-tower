# Hero map temple and flood-camera screening —21October2026

## User intent

Make Wat Mahathat on the main city map an architectural3D model rather than boxes. Upgrade graphics, and make camera vision useful for flood mitigation. The user clarified this concerns the main map, not a particular downloadable external asset.

## Evidence and placement

The old hand-authored temple position(8.4367,99.9638) was approximately2.8km north of the actual site. Both the search placeholder and procedural model inherited it, and earlier tests asserted that erroneous coordinate. Corrected to the published nomination reference8°24′41.31″N,99°57′58.38″E(8.411475,99.9662166667), sourced from the [nomination identification](https://www.phramahathatworldheritage.org/index.php/en/world-heritage/identification-of-the-nominated-property), corroborated by the [temple's own map](https://watphramahathat.watportal.com/) and OSM node1586071745. This is a published site reference, not a surveyed mesh registration.

One JSON reference now supplies the runtime centre and search-feature generator. The generator preserves traced buildings and cannot recreate the fabricated compound wall. Search and model coordinates have independent regression expectations against the published coordinate.

The existing NST Sketchfab reconstruction67d8526c53b144bd8304060919b3186e reports isDownloadable:false and an empty licence object. No mesh was extracted or repackaged. The separately labelled Ayutthaya scan is not used on the NST map.

## Graphics

Replaced nine stacked circular columns with a smooth-normal bell mesh and a ringed gold spire, retaining the56m overall height and28m stepped plinth. Profiles are authored reconstruction detail, not measured surface geometry. Six drawing layers replace the old13; mesh buffers are generated once, with a small mobile-compatible vertex budget. The [deck.gl mesh contract](https://deck.gl/docs/api-reference/mesh-layers/simple-mesh-layer) uses local metric offsets at the corrected geospatial anchor.

Neutral architectural lighting improves form without claiming to simulate current sunlight or running experimental shadow passes. Existing traced halls retain their footprint-based roofs. TEMPLE3D is part of the map's search/action group, enables the temple/building layers, and flies to the site in3D. A view-mode effect and target flight initially raced; the requested target now travels with the orientation command.

## Flood computer vision

Water-camera dots/directories now offer an explicit image-comparison mode from the map's camera dialog. It replaces the live iframe, avoiding a second simultaneous live player. It uses the existing bounded capture pool, one selected camera, explicit Start, and local processing. The same tool remains available in Flood Watch.

- Operator chooses a visible boundary; the first image is a reference, not a known dry/safe state.
- Current/reference frames are shown together. A dashed line marks the detected image boundary, not a calibrated water elevation.
- Existing contrast/illumination/repeat/reference-age checks now also reject dimension changes and gross fixed-scene changes outside the marked ROI.
- A clock expires stale frames even when no new frame arrives. Paused monitoring cannot retain an active verdict.
- Automatic camera summaries no longer show a green 'water not rising' inference from zero alerts or a first baseline. Old/paused checks are labelled unavailable; cumulative flags are historical and unconfirmed.
- Camera-modal pipeline detections are explicitly historical and show a complete Bangkok timestamp.

This is image-change screening, not water segmentation, optical-flow registration, centimetre measurement, flood confirmation or a24/7inference service. Gross scene checks can miss subtle motion and can reject real changes; reflections and PTZ require human review. No previews are promoted to trusted shared detections or evacuation commands.

## Validation

Unit checks cover finite mesh geometry/normals/index bounds,56m rendered top with scaling applied once, published placement matching the search feature, scene/dimension rejection, and absence of a CV all-clear. Responsive browser checks use real local geometry and synthetic feeds, assert the requested camera position, render the temple at1440/1024/390px, and exercise explicit-start selected-camera comparison. Independent visual review and release CI accompany this change.

Local validation:1113 web unit tests passed; web typecheck and production build passed. Browser checks passed at1440/1024/390px for temple rendering and1440/390px for camera comparison. The phone camera test exposed an existing dialog inside an inert map panel; moved the dialog to the application modal group so cameras opened from Layers remain accessible. Independent visual review covers the generated screenshots. Full release CI remains the deployment gate.
