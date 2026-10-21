# Building realism audit — 21 October2026

User evidence: yellow3D structures looked like ruined walls rather than NST buildings.

## Study and cause

The2,458-footprint source contains153 legacy `_elevM=28` guesses, mostly religious sites, despite almost no source height tags. Walls applied these guesses as minimums, then exaggerated height1.65×. The old roof code used a different height calculation, ground-up extrusion and another invented12m sacred-building crown; the roof was also gated behind a setting absent from current layer defaults. This was thematic colouring and invented vertical mass, not architecture.

References: [official temple photographs](https://watphramahathat.watportal.com/), [TAT temple page](https://www.tourismthailand.org/Promotions/69/embark-on-a-spiritual-journey-and-discover-the-divine-beauty-of-wat-phra-mahathat-woramahawihan-2), [deck.gl polygon3D coordinate contract](https://deck.gl/docs/api-reference/layers/polygon-layer). Reference photographs show white masonry, tiled halls and a white central chedi with a gold finial. These inform a schematic material palette; they do not verify each footprint's roof material or shape. No third-party image assets were copied into the product.

## Corrections

- Single height authority for walls and roofs: source height, normalized storeys, then conservative type/area estimates. Removed obsolete landmark-height minimums and all building-height exaggeration.
- A large unknown footprint no longer implies a10–15storey tower. Unclassified area-model estimates remain low-rise; explicit source heights/storeys retain priority.
- Natural, opaque neutral walls in3D. Category colours remain in2D, with the distinction explained in the mounted map legend.
- Simple convex temple halls receive footprint-clipped, metric ridge roofs and closed gable ends. Courtyards/holes remain open; complex shapes and unverified non-hall roofs keep flat caps. Gables/materials are explicitly schematic.
- Roof planes sit at the same eaves/ridge elevations as their walls; no second ground-up prism. Wall and roof LOD populations match and roofs render with the Buildings toggle. No separate hidden roof activation is required.
- The central chedi's base elevations were ignored in the old renderer: every tier started at ground level. Actual3D accessors now place each section at its cumulative base; the summit reaches56m and scaling is applied only once.
- Removed invented compound halls, prang and satellite placements. Surrounding buildings use traced footprints. The dimensioned central chedi replaces its duplicate footprint prism whenever3D buildings are enabled.
- Mounted provenance now says height-tagged rather than measured and does not claim roof materials/shapes are verified or photogrammetric.

## Verification

Geometry regressions check tagged-height precedence, normalized storeys, rejection of the28m legacy floor,1:1 wall scale, attached roof elevations, footprint coverage, courtyard holes and actual rendered chedi segment endpoints reaching56m without double scaling. Browser tests explicitly enable buildings, enter3D, search the central monument and a separate city temple, and check rendering errors at1440/1024/390px. Independent review confirmed visible spire, grounded roof planes and no yellow ruin columns. Screenshots use real local footprints with synthetic API feeds, not current flood evidence.

Limit: these are schematic buildings from sparse footprint metadata, not a surveyed digital reconstruction. Unknown roof shapes remain simplified rather than fabricated as ornate monuments.
