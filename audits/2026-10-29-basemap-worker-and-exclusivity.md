# Basemap switching — 29 October 2026

Task: selecting a basemap must visibly replace the previous ground surface, or explain why the selected source cannot run.

Found: MapLibre6.14's inferred /assets/maplibre-gl-worker.mjs?v=6.14.0 returns HTTP200 text/html (SPA fallback). Both Chrome production inspection and the user's WebKit tab report “Worker failed to load.” Bundling the main library does not copy this relative worker asset. Esri was visibly verified in the user's tab after selecting it; Khao Luang terrain did switch off. Thus the screenshot does not establish that terrain blocks every basemap. Google satellite was missing from the exclusivity group, and the Google textured3D mesh could also coexist with competing ground surfaces. Google controls accepted selection even without a configured key, showing no imagery or indefinite3D loading.

Changed: import the worker through Vite's worker&url pipeline and set MapLibre's worker URL before map construction. Google satellite and textured3D mesh join the existing mutually exclusive ground-source group. When no Google key is configured, preserve the current map, leave Google unselected, show the existing needs-key status and explain the Esri alternative on activation. Correct terrain description from obsolete6× exaggeration to its actual1:1 scale.

Verified:46preset unit tests, web typecheck and production build pass. Build emits maplibre-gl-worker-BRoQESvQ.js as506kB JavaScript. Two focused browser regressions pass against a production-config preview: worker response is JavaScript rather than HTML and its worker context executes; Esri deselects terrain and missing-key Google leaves Esri selected with an explanation. The smoke tests stub provider tiles/terrain geometry to bound GPU/network work, while rendered evidence uses actual imagery. Production no-key behavior was tested with VITE_GOOGLE_MAPS_API_KEY empty; local configured keys are not disclosed or modified.

Evidence: /Volumes/Data/agent-artifacts/NST/2026-10-29-basemap. Browser trace/network evidence is scoped to map diagnosis; no observation clocks, flood verdicts, service processes, credentials or source data were changed. Availability of licensed Google imagery still requires operator configuration and provider coverage; this change does not invent a credential or certify Google coverage for NST.

Release requires successful CI, automatic deployment and live worker/basemap verification. This is a map reliability correction, not a flood-safety certification or a full visual pass of every lens/menu.
